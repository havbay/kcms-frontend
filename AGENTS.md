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

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
