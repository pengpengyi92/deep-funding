def retrieve_compliance(records, company):
    tags = set(company.evidence_json.get("review_topics", []))
    # Templates are generic review prompts; named cases require an explicit relevant topic.
    results = []
    for record in records:
        if record["kind"] != "compliance":
            continue
        overlap = tags.intersection(record["risk_tags"])
        if record["record_type"] == "template" or overlap:
            results.append({
                "id": record["id"], "name": record["name"], "status": record["status"],
                "evidence_level": record["evidence_level"], "risk_tags": record["risk_tags"],
                "sources": record["source_urls"], "content_hash": record["content_hash"],
                "relevance": "generic review checklist" if not overlap else "explicit review-topic overlap",
                "finding": "requires_review",
                "applies_to_company_as_fact": False,
                "claims": record["claims"],
            })
    return results
