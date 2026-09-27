# Unit 2: hooks `InstallCreateSettingsResponder`

This trial unit switched `packages/hooks/src/responders/install/create-settings/install-create-settings-responder.ts`
from the old file-read adapter to the gateway's `readJsonFileIfExists`. The data-loss bug this fixed, and the
fixed behavior, are recorded in `scrolls/gateway-build/README.md` section 5 (Trial 1, row 2) and in the
responder's own header comment.

One behavior of the fix is not written down anywhere else. The responder awaits the settings read before it
calls `installAgentsSetupBroker`. When the read rejects — a corrupt or unreadable `settings.json` — the
responder throws before that call runs, so agent setup does not run either. Before this fix, a failed read
collapsed to `null` and agent setup always ran regardless. A future change to this responder needs to keep
that order, or change it on purpose.

Every lint and cross-package proxy-hoisting problem this unit hit is fixed for good now, in
`packages/testing/src`. `scrolls/gateway-build/README.md` sections 4 and 6 describe those fixes.
