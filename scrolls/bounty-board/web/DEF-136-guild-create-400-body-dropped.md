# DEF-136: The web post wrapper drops the 400 body, and the unused add-guild modal lacks the path check

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: the form cannot show the server's 400 message |
| Package | web |
| Found | 2026-09-29, walkthrough case SL-088 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The user created a guild through the NEW GUILD form in the lane `inst_8591259dc557490183ee35dc08634557` with name `jod` and path `jo`. The create route saved it (`config.json`: `'jod' 'jo' jod 2026-09-29T00:30:54.570Z`) although the guild contract requires an absolute path. The route, form and `pathIsAccessibleBroker` are now guarded, but two things are left:

1. The web fetch-post wrapper drops the 400 body, so the form cannot show the server's message. (The old `fetchPostAdapter` is gone; find the `#gateway/browser` wrapper or web broker the form uses. Not located on 2026-09-30.)
2. `guild-add-modal-widget.tsx` lacks the check. The ledger said it is never opened; `home-content-widget.tsx:26` references `guild-add-modal` on 2026-09-30, so check whether it is live.

## What should happen

The form shows a validation error naming the field, from the server's 400 body. The modal applies the same absolute-path check.

## Where to look

- `packages/web/src/widgets/home-content/home-content-widget.tsx:26`
- `packages/web/src/widgets/guild-add-modal/` (and the guild form widget)
- `packages/server/src/responders/guild/add/guild-add-responder.ts:36-41` (the 400 answer)

## History

`958e3d0c3`, merge `4c5d9ab62`, ward runs `1790715879532-b693`, `1790716602531-4492`: the guild path contract accepts relative paths; the route, form and `pathIsAccessibleBroker` guard it.
