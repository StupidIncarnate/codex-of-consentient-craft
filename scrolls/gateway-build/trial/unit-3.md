# Unit 3: mcp `install-config-create-responder`

This trial unit switched `packages/mcp/src/responders/install/config-create/install-config-create-responder.ts`
from the old file-read adapter to the gateway's `readJsonFileIfExists`. The data-loss bug this fixed, and the
fixed behavior, are recorded in `scrolls/gateway-build/README.md` section 5 (Trial 1, row 3) and in the
responder's own header comment.

One behavior of the fix is not written down anywhere else. The responder awaits the `.mcp.json` read before
it calls `settingsPermissionsAddBroker` and `agentsPluginCreateBroker`. When the read rejects — a corrupt or
unreadable `.mcp.json` — the responder throws before either call runs, so neither broker runs. Before this
fix, a failed read collapsed to `existingConfig = null` and both brokers always ran regardless. A future
change to this responder needs to keep that order, or change it on purpose.

Every lint and cross-package proxy-hoisting problem this unit hit is fixed for good now, in
`packages/testing/src` and in `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/`.
`scrolls/gateway-build/README.md` sections 4 and 6 describe those fixes.
