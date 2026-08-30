# KCMS V2 Frontend Agent Instructions

Before any task, read the canonical sibling planning repository:

1. `../kcms-planning/00-product-specification.md`
2. `../kcms-planning/04-implementation-roadmap.md`
3. `../kcms-planning/agent-memory/current-state.md`
4. `../kcms-planning/01-frontend-redesign-plan.md`
5. `../kcms-planning/05-opendesign-workflow.md`
6. `../kcms-planning/03-api-contract.md`

Work only on the active part. Do not create production screens before their
design handoff is approved. Direct Codex handoffs are accepted under planning
decision D-017; OpenDesign remains optional. Do not hand-maintain API response types when a
generated OpenAPI client owns them. Production entry points must not import test
fixtures or sample customer data.

Before ending, run the active part's frontend and live integration gates and update
the canonical frontend and integration state files.
