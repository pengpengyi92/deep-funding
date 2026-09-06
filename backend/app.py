import json
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import ValidationError
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.exc import IntegrityError

from . import models as m, schemas as s
from .database import ROOT, initialize, make_database
from .knowledge import filter_knowledge, load_knowledge, sync_knowledge
from .services.matching import generate_match, snapshot


def serialize(record):
    return jsonable_encoder({column.name: getattr(record, column.name) for column in record.__table__.columns})


class LocalBoundary:
    """Reject rebinding, remote clients, cross-site reads and CSRF before body parsing."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])
        host = headers.get(b"host", b"").decode("latin1")
        hostname = urlsplit("//" + host).hostname
        client = scope.get("client")
        reason, status = None, 403
        if hostname not in {"127.0.0.1", "localhost", "::1"} or not client or client[0] not in {"127.0.0.1", "::1", "testclient"}:
            reason = "Private database is loopback-only. Do not expose this single-owner service."
        origin = headers.get(b"origin", b"").decode("latin1")
        if origin and origin != f"{scope['scheme']}://{host}":
            reason = "Same-origin request required."
        if headers.get(b"sec-fetch-site") == b"cross-site":
            reason = "Cross-site access denied."
        if scope["method"] not in {"GET", "HEAD", "OPTIONS"}:
            if headers.get(b"x-deep-funding-local") != b"1":
                reason = "Local workspace header required."
            if not headers.get(b"content-type", b"").startswith(b"application/json"):
                reason, status = "JSON content type required.", 415
        if reason:
            return await JSONResponse({"detail": reason}, status_code=status)(scope, receive, send)
        total = 0
        messages = []
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            total += len(message.get("body", b""))
            if total > 131072:
                return await JSONResponse({"detail": "Body exceeds 128 KiB."}, status_code=413)(scope, receive, send)
            messages.append(message)
            if not message.get("more_body"):
                break

        async def replay():
            return messages.pop(0) if messages else await receive()

        async def secured_send(message):
            if message["type"] == "http.response.start":
                message["headers"].extend([
                    (b"cache-control", b"no-store"), (b"x-content-type-options", b"nosniff"),
                    (b"referrer-policy", b"no-referrer"), (b"x-frame-options", b"DENY"),
                ])
            await send(message)
        await self.app(scope, replay, secured_send)


def create_app(url=None, knowledge_root=ROOT):
    engine, sessions = make_database(url)
    knowledge = load_knowledge(knowledge_root)

    @asynccontextmanager
    async def lifespan(_):
        initialize(engine)
        with sessions.begin() as session:
            sync_knowledge(session, knowledge)
        yield
        engine.dispose()

    app = FastAPI(title="Deep Funding private database", version="0.3.0", lifespan=lifespan,
                  description="Loopback-only, single-owner research workspace. No hosted authentication or investment advice.")
    app.add_middleware(LocalBoundary)
    app.state.sessions = sessions
    app.state.engine = engine
    app.state.knowledge = knowledge

    def db():
        with sessions.begin() as session:
            yield session

    @app.exception_handler(IntegrityError)
    async def conflict(_request, _exc):
        return JSONResponse(status_code=409, content={"detail": "Duplicate record or invalid linked record."})

    router = APIRouter()

    @router.get("/health")
    def health():
        return {"version": "0.3.0", "mode": "local-private", "persistent": True,
                "authentication": "single-owner loopback boundary", "engine": "rules-v0.3.0"}

    def get_record(session, model, record_id):
        row = session.get(model, record_id)
        if row is None:
            raise HTTPException(404, "Record not found")
        return row

    def register_crud(path, model, schema, patch=None):
        def create(payload: schema, session=Depends(db, scope="function")):
            row = model(**payload.model_dump())
            session.add(row)
            session.flush()
            if model is m.User:
                session.add(m.Subscription(user_id=row.id))
                session.flush()
            return serialize(row)

        def detail(record_id: str, session=Depends(db, scope="function")):
            return serialize(get_record(session, model, record_id))

        def listing(limit: int = Query(100, ge=1, le=100), offset: int = Query(0, ge=0, le=1000000),
                    session=Depends(db, scope="function")):
            return [serialize(row) for row in session.scalars(
                select(model).order_by(model.created_at.desc(), model.id).offset(offset).limit(limit))]

        router.add_api_route(path, create, methods=["POST"], status_code=201, name=f"create_{model.__tablename__}")
        router.add_api_route(path, listing, methods=["GET"], name=f"list_{model.__tablename__}")
        router.add_api_route(path + "/{record_id}", detail, methods=["GET"], name=f"read_{model.__tablename__}")
        if patch:
            def update(record_id: str, payload: patch, session=Depends(db, scope="function")):
                row = get_record(session, model, record_id)
                merged = {key: getattr(row, key) for key in schema.model_fields}
                merged.update(payload.model_dump(exclude_unset=True))
                try:
                    valid = schema.model_validate(merged)
                except ValidationError as error:
                    raise HTTPException(422, "Invalid merged profile: " + "; ".join(
                        str(item["loc"]) + " " + item["msg"] for item in error.errors())) from error
                for key, value in valid.model_dump().items():
                    setattr(row, key, value)
                session.flush()
                return serialize(row)
            router.add_api_route(path + "/{record_id}", update, methods=["PATCH"], name=f"update_{model.__tablename__}")

    register_crud("/users", m.User, s.UserInput)
    register_crud("/founders", m.FounderProfile, s.FounderInput, s.FounderPatch)
    register_crud("/companies", m.CompanyProfile, s.CompanyInput, s.CompanyPatch)
    register_crud("/funding-providers", m.FundingProviderProfile, s.ProviderInput, s.ProviderPatch)
    register_crud("/funding-preferences", m.FundingPreference, s.PreferenceInput, s.PreferencePatch)

    @router.post("/funding-needs", status_code=201)
    def create_need(payload: s.FundingNeedInput, session=Depends(db, scope="function")):
        get_record(session, m.CompanyProfile, payload.company_id)
        row = m.CompanyFundingNeed(**payload.model_dump())
        session.add(row)
        session.flush()
        return serialize(row)

    @router.get("/funding-needs/{company_id}")
    def needs(company_id: str, session=Depends(db, scope="function")):
        get_record(session, m.CompanyProfile, company_id)
        return [serialize(row) for row in session.scalars(select(m.CompanyFundingNeed).where(
            m.CompanyFundingNeed.company_id == company_id).order_by(m.CompanyFundingNeed.created_at.desc(), m.CompanyFundingNeed.id))]

    @router.post("/matches/generate", status_code=201)
    def generate(payload: s.GenerateInput, session=Depends(db, scope="function")):
        company = get_record(session, m.CompanyProfile, payload.company_id)
        provider = get_record(session, m.FundingProviderProfile, payload.funding_provider_id)
        need = session.scalar(select(m.CompanyFundingNeed).where(m.CompanyFundingNeed.company_id == company.id)
                              .order_by(m.CompanyFundingNeed.created_at.desc(), m.CompanyFundingNeed.id).limit(1))
        match = generate_match(session, company, provider, need, knowledge)
        return serialize(match)

    @router.get("/matches/{record_id}")
    def read_match(record_id: str, session=Depends(db, scope="function")):
        row = get_record(session, m.Match, record_id)
        data = serialize(row)
        company = get_record(session, m.CompanyProfile, row.company_id)
        provider = get_record(session, m.FundingProviderProfile, row.funding_provider_id)
        preference = session.scalar(select(m.FundingPreference).where(m.FundingPreference.funding_provider_id == provider.id))
        need = session.scalar(select(m.CompanyFundingNeed).where(m.CompanyFundingNeed.company_id == company.id)
                              .order_by(m.CompanyFundingNeed.created_at.desc(), m.CompanyFundingNeed.id).limit(1))
        data["stale"] = any(row.evidence_json.get(key) != value for key, value in (
            ("company_snapshot", snapshot(company)), ("provider_snapshot", snapshot(provider)),
            ("preference_snapshot", snapshot(preference) if preference else None),
            ("need_snapshot", snapshot(need) if need else None),
        ))
        return data

    @router.patch("/matches/{record_id}")
    def match_status(record_id: str, payload: s.MatchStatusInput, session=Depends(db, scope="function")):
        row = get_record(session, m.Match, record_id)
        previous = row.status
        row.status = payload.status
        session.add(m.AuditRecord(entity_type="match", entity_id=row.id, audit_type="human_status_update",
                                 severity="info", finding=f"{previous} -> {row.status}",
                                 evidence={"note": payload.note, "operator": "local owner"},
                                 recommendation="Status log only; no external action executed."))
        session.flush()
        return serialize(row)

    def register_list(path, model):
        def listing(limit: int = Query(100, ge=1, le=100), offset: int = Query(0, ge=0, le=1000000),
                    session=Depends(db, scope="function")):
            return [serialize(row) for row in session.scalars(
                select(model).order_by(model.created_at.desc(), model.id).offset(offset).limit(limit))]
        router.add_api_route(path, listing, methods=["GET"], name=f"list_{model.__tablename__}")
    register_list("/matches", m.Match)
    register_list("/agent-runs", m.AgentRun)
    register_list("/audits", m.AuditRecord)

    @router.get("/knowledge/{kind}")
    def knowledge_api(kind: str, q: str = "", category: str = "", stage: str = "", industry: str = "",
                      location: str = "", company: str = "", jurisdiction: str = "", status: str = "",
                      evidence_level: str = "", risk_tags: str = ""):
        if kind not in ("funding", "compliance"):
            raise HTTPException(404)
        records = filter_knowledge(knowledge, kind, q=q, category=category, stage=stage, industry=industry,
                                   location=location, company=company, jurisdiction=jurisdiction,
                                   status=status, evidence_level=evidence_level, risk_tags=risk_tags)
        return {"records": records, "total": len(records), "version": "0.3.0"}

    @router.get("/database")
    def tables(session=Depends(db, scope="function")):
        return {"tables": [{"name": name, "count": session.scalar(select(func.count()).select_from(model)),
                             "columns": [c.name for c in model.__table__.columns]} for name, model in m.TABLES.items()],
                "mode": "local-private", "version": "0.3.0"}

    @router.get("/database-forms")
    def forms():
        return {name: {"path": path, "schema": schema.model_json_schema()} for name, path, schema in (
            ("users", "users", s.UserInput), ("founders", "founders", s.FounderInput),
            ("companies", "companies", s.CompanyInput),
            ("funding_providers", "funding-providers", s.ProviderInput),
            ("funding_preferences", "funding-preferences", s.PreferenceInput),
            ("funding_needs", "funding-needs", s.FundingNeedInput),
        )}

    @router.get("/database/{table}")
    def table_rows(table: str, q: str = Query("", max_length=200), sort: str = "created_at",
                   direction: str = Query("desc", pattern="^(asc|desc)$"),
                   filter_field: str = "", filter_value: str = Query("", max_length=200),
                   limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0, le=1000000),
                   session=Depends(db, scope="function")):
        model = m.TABLES.get(table)
        if model is None:
            raise HTTPException(404, "Unknown table")
        columns = model.__table__.columns
        if sort not in columns or (filter_field and filter_field not in columns):
            raise HTTPException(422, "Unknown column")
        conditions = []
        if q:
            conditions.append(or_(*(cast(column, String).contains(q, autoescape=True) for column in columns)))
        if filter_field:
            conditions.append(cast(columns[filter_field], String) == filter_value)
        count = session.scalar(select(func.count()).select_from(model).where(*conditions))
        ordering = columns[sort].desc() if direction == "desc" else columns[sort].asc()
        rows = session.scalars(select(model).where(*conditions).order_by(ordering, model.id).offset(offset).limit(limit))
        return {"records": [serialize(row) for row in rows], "total": count, "limit": limit, "offset": offset}

    # Exact spec API paths locally; /api/v3 avoids colliding with the preserved Worker v0.2 API.
    app.include_router(router, prefix="/api")
    app.include_router(router, prefix="/api/v3", include_in_schema=False)

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        dist = (ROOT / "dist").resolve()
        target = (dist / path).resolve()
        if not target.is_relative_to(dist):
            raise HTTPException(404)
        if target.is_file():
            return FileResponse(target)
        if not (dist / "index.html").is_file():
            raise HTTPException(503, "Run npm run build first.")
        html = (dist / "index.html").read_text(encoding="utf-8")
        return HTMLResponse(html.replace("</head>", '<meta name="deep-funding-runtime" content="local-private"></head>'))
    return app


app = create_app()
