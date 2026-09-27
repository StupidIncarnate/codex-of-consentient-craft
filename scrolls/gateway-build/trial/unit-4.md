# Unit 4: config `install-create-config-responder`

`scrolls/gateway-build/README.md` section 5 (Trial 1, row 4) covers the outcome. The responder now
reports three separate cases for a read failure: a missing file, an invalid-JSON file, and an
unreadable file. Each case carries the real error text.

## Why a skipped write can still report `success: true`

A responder can skip a write and still report `success: true`. `installExecuteBroker`
(`packages/cli/src/brokers/install/execute/install-execute-broker.ts:52-53`) only builds its own
failure result when the `StartInstall` call throws. It otherwise passes the call's own result through
`installResultContract.parse`. `installResultContract` allows an optional `error` field on a
`success: true` result. Nothing downstream reads that field as a failure signal. This is why
`install-create-config-responder` can skip the write on a read failure, return `success: true` with
`action: 'skipped'`, and put the real reason in `error`, instead of throwing.
