#!/bin/bash
cd /home/brutus-home/projects/codex-of-consentient-craft
export DUNGEONMASTER_HOME="${DUNGEONMASTER_HOME:-$(pwd)/.dungeonmaster}"
# --conditions=source resolves every @dungeonmaster/* import to TypeScript source instead of dist/.
# The inspector spawns a FRESH child per connection, so with this flag a reconnect in its UI picks up
# an edit anywhere in the workspace; without it, only packages/mcp/src/** reloads and everything in
# shared/orchestrator needs a build first. `ward` declares no `source` export condition, so it still
# resolves to dist/ either way.
exec tsx --conditions=source packages/mcp/src/index.ts
