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

## Before Ending Any Task

Run the active part's frontend and live integration gates, then **update the
canonical state files in the same task**, before reporting back:

- `../kcms-planning/agent-memory/frontend-state.md` — screens, runtime evidence,
  and anything that cost time to work out.
- `../kcms-planning/agent-memory/integration-state.md` — when the contract or a
  cross-repository behaviour changed.
- `../kcms-planning/agent-memory/next-actions.md` — when what comes next changed.

Delete claims the task invalidated. A stale state file is worse than none,
because the next person trusts it.

Check gate results by exit code. Piping a command to `tail` reports the exit
code of `tail`, so a failing suite can look green.
