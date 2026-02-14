# Design Requirements Not Captured in Mocks

Requirements that the static prototype can't demonstrate but must be implemented in the real app.

## Animations

- [ ] **Map frame expansion on page transition** - When navigating from landing to quest detail, the map frame should
  animate its growth from the centered box to full-page layout. Not a hard cut - a smooth expansion.
- [ ] **Right panel slide-in** - When right panel content appears (clarification, approval, design proto), it should
  animate in rather than pop.
- [ ] **Raccoon state animations** - Animate the raccoon wizard with mirror (horizontal flip) and bounce (up/down)
  animations tied to various chat states (thinking, waiting, tool calls, etc.). TBD on which animation maps to which
  state.

## Real-Time Behavior

- [ ] **Chat streaming** - ChaosWhisperer messages should stream in token-by-token, not appear as complete blocks.
- [ ] **Tool call indicators** - Tool calls should show a spinner/loading state while in progress, then resolve to the
  result.
- [ ] **Clarification questions from LLM** - Questions appear on the right panel in real-time as ChaosWhisperer decides
  it needs clarification. User answer sends back through chat.
- [ ] **Plan building progressively** - Requirements/observables/contracts should appear on the right panel as
  ChaosWhisperer constructs them, not all at once.

## Interactions Not Mocked

- [ ] **Requirement status toggling** - On approval screen, user should be able to click each requirement to toggle
  between approved/deferred/proposed.
- [ ] **Inline editing with validation** - Edit mode inputs should validate (non-empty names, valid scopes, etc.).
- [ ] **Add new items in edit mode** - The `+` button should insert a blank editable input box underneath the list.
- [ ] **Approval buttons always visible** - Approve/Modify/Submit/Cancel buttons stay fixed at the bottom of the right
  panel while section content scrolls above.
- [ ] **Design proto iframe** - Right panel should render an actual iframe pointing to the design spec's dev server URL.
- [ ] **Chat scroll anchoring** - Chat should auto-scroll to bottom on new messages, but respect manual scroll-up to
  read history.
- [ ] **Delete row soft-delete** - Clicking delete on edit screens shows the row's display view crossed out (
  strikethrough), with an undo icon button in place of the delete icon button. Row is not removed until submit.
