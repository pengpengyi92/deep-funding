# Resource Types

Non-financial resources: enterprise distribution, technical expertise, recruiting, overseas expansion, manufacturing, regulatory support, office space, cloud credits, GPU compute, mentorship, legal support, founder network, investor network, fundraising support and customer introductions.

These are separate from `capital_forms` and `provides_capital`. Resource promises need an owner, current scope, eligibility, cost and source. Credits are not cash or unrestricted capital; do not sum their nominal values into a cash ticket.

A resource-only company request sets resourceOnly=true, raiseUsd=0 and at least one strategic need. A non-investing provider sets provides_capital=false, capital_forms=[] and ticket_usd=null. Matching checks resource overlap without a positive cash requirement. A cash request cannot be satisfied by resources alone. Unknown is not zero and not false.
