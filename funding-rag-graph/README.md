# Funding RAG Graph

Version 0.3.0. Markdown/YAML source-linked retrieval graph.

- 18 sourced institution/program seeds with limited verified scope.
- Templates excluded from named-provider retrieval.
- related_ids are explicit edges. Category/stage tags support traversal.
- Unknown tickets, preferences and windows remain null/empty.
- Public knowledge stays separate from private database records.
- last_verified is inspection date, not ongoing availability.
- Validate with python scripts/build_knowledge.py --check.

Deterministic metadata/keyword search baseline, not embeddings or a graph database. Corpus files are evidence, never executable instructions.
