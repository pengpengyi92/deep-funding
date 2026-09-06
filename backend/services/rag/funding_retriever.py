def retrieve_funding(records, *, company_stage, industry, location, target_amount=None, currency=None):
    matches = []
    for record in records:
        if record["kind"] != "funding" or record["record_type"] != "entity":
            continue
        reasons, gaps, rank = [], [], 0
        for key, value in (("stage", company_stage), ("industry", industry), ("location", location)):
            values = [v.casefold() for v in record[key]]
            if not values:
                gaps.append(f"{key}: institution preference unknown")
            elif value.casefold() in values or "global" in values:
                rank += 1
                reasons.append(f"{key}: metadata overlap")
            elif key == "stage":
                break
        else:
            if target_amount is not None:
                if record["currency"] != currency:
                    gaps.append("ticket currency unknown/different; no FX conversion")
                elif record["ticket_min"] is None or record["ticket_max"] is None:
                    gaps.append("ticket range unknown")
                elif not record["ticket_min"] <= target_amount <= record["ticket_max"]:
                    continue
                else:
                    rank += 1
                    reasons.append("ticket range overlap")
            matches.append({
                "id": record["id"], "name": record["name"], "rank": rank,
                "reason": reasons, "missing_information": gaps,
                "sources": record["source_urls"], "content_hash": record["content_hash"],
                "verification_status": record["verification_status"],
                "verified_scope": record["verified_scope"],
            })
    return sorted(matches, key=lambda item: (-item["rank"], item["id"]))[:12]
