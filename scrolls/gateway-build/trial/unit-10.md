# Unit 10: fileScannerBroker's own glob copy → `glob` from `@dungeonmaster/npm/glob`

This is a Trial 1 unit: the gateway imported by its raw package name, before the move to
`packages/@gateway/` and the `#gateway/<folder>/<subpath>` import form (see
`scrolls/gateway-build/README.md` section 1). It switched
`packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts`'s own glob call to `glob` from
`@dungeonmaster/npm/glob`. No adapter was deleted: `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts`
still has a live caller, `mcpDiscoverBroker`, and `scrolls/gateway-build/coverage.md` already lists
that adapter with the fate `gateway`, meaning it is still due to move.

## A caller's own name can collide with a gateway export's name

`fileScannerBroker` names its own parameter `glob` — the caller-supplied search pattern. Importing
the gateway's `glob` function under its own name would have silently shadowed that parameter, so
every real call would try to call the pattern value instead of the function. This unit aliased the
import as `globFind` to avoid the collision. `typecheck` does catch this kind of collision, but as a
plain "not callable" error at the call site, not at the import, so it takes a moment to trace back to
the real cause. Any caller migrating a name that collides with a gateway export needs to alias one
side.

## The gateway `glob` wrapper changes the shape of a failure

The gateway's `glob` function wraps a rejection in `Error('glob failed for pattern "<pattern>":
<reason>', {cause})`, naming the resolved absolute pattern. The adapter it replaces let whatever
`glob` itself threw propagate unwrapped. Neither this broker nor the gateway wrapper adds its own
`try`/`catch` — the rejection still propagates either way. What changes is the error's shape: any
caller that reads or matches on the old, unwrapped error text needs to expect the new, wrapped one
instead.

## `globProxy`'s current test-double surface

A later unit fixed the gateway's own `glob` proxy, now under `packages/@gateway/npm/src/glob/`, to
match what the adapter proxy it replaced could do. It still stages `returns`/`throws` by an exact
pattern and an exact, full options object, the same as when this unit ran. It adds a
constructor-time default, `handle.calledWith([]).resolves([])`, so a call with no staged address
resolves empty instead of throwing. It adds `returnsMatchingTail`/`throwsMatchingTail`, staged by the
same first-wildcard-onward comparison the retired adapter proxy used. These two take an optional,
partial options object, so a caller can check only the keys it names, not the whole object. It adds
`getOptionsFor`/`getCallsFor`, which read back the real call or calls that matched a staged address.
