# web · render-images-in-transcript · 332e0da3-47aa-4f78-b3eb-15fbded0bdfe

## Design settled before briefing

- Optimistic content stays the composer's serialised text: `A[Pasted Image 1]B` (bare placeholder).
  Design decision #normalise-before-comparing states this explicitly. Do NOT inline a data URL there.
- The bubble resolves a BARE placeholder against in-memory data URLs held in a new
  `pastedImageMemoryState`, keyed by the optimistic entry's uuid. The transcript copy carries the
  markdown token `![Pasted Image 1](http://host/api/images?path=…)` and resolves from its own
  parentheses. Two resolution sources, one renderer.
- The optimistic entry's uuid dies with it, so once the transcript entry replaces it the memory
  lookup misses and the surviving bubble uses the URL — which is #check-surviving-bubble-uses-url.
- `hasEquivalentChatEntryGuard` is the ONE comparison point (3 call sites). Making the GUARD
  normalise fixes the followup filter, the create-surface filter, and the new synthetic-bucket
  filter at once.

## Groups

GROUP 1  (independent files)
  packages/web/src/contracts/transcript-segment/transcript-segment-contract.ts        new   — zod discriminated union: {kind:'text', text} | {kind:'image', ordinal, src}. src is HTMLImageElement['src']-shaped plain string (mirror the ImageOverlayWidgetProps.src reasoning), ordinal branded via a new ordinal contract or reuse existing.
  packages/web/src/contracts/transcript-segment/transcript-segment-contract.test.ts   new
  packages/web/src/contracts/transcript-segment/transcript-segment.stub.ts            new
  packages/web/src/transformers/normalise-chat-content/normalise-chat-content-transformer.ts       new  — cut from pastedImageStatics.promptSentinel onward, then reduce every imageTokenPattern match to its placeholder form `[Pasted Image N]`. Patterns READ FROM @dungeonmaster/shared/statics, never re-declared.
  packages/web/src/transformers/normalise-chat-content/normalise-chat-content-transformer.test.ts  new
  packages/web/src/state/pasted-image-memory/pasted-image-memory-state.ts             new  — Map<ChatEntryUuid, readonly ImageDataUrl[]>; remember/recall/forget/clear
  packages/web/src/state/pasted-image-memory/pasted-image-memory-state.proxy.ts       new
  packages/web/src/state/pasted-image-memory/pasted-image-memory-state.test.ts        new
  packages/web/src/widgets/image-overlay/image-overlay-widget.tsx                     edit — nothing structural; confirm Mantine Modal's closeOnEscape/closeOnClickOutside are ON (defaults) and the close control is reachable
  packages/web/src/widgets/image-overlay/image-overlay-widget.proxy.tsx               edit — add pressEscape(), clickOutside(), hasCloseButton()
  packages/web/src/widgets/image-overlay/image-overlay-widget.test.tsx                edit — add the three close cases + close-control-visible

GROUP 2  (needs group 1)
  packages/web/src/transformers/parse-transcript-segments/parse-transcript-segments-transformer.ts       new  — content + optional memoryImages -> readonly TranscriptSegment[]. Cut trailer first, then split on imageTokenPattern (src = group 2) AND on placeholderPattern (src = memoryImages[ordinal-1], segment dropped when absent).
  packages/web/src/transformers/parse-transcript-segments/parse-transcript-segments-transformer.test.ts  new
  packages/web/src/guards/has-equivalent-chat-entry/has-equivalent-chat-entry-guard.ts        edit — compare normaliseChatContentTransformer output on both sides
  packages/web/src/guards/has-equivalent-chat-entry/has-equivalent-chat-entry-guard.test.ts   edit — add image-token and trailer cases; keep every existing text-only case green

GROUP 3  (needs group 2)
  packages/web/src/widgets/chat-message/image-content-layer-widget.tsx        new  — renders the parsed segments: text spans + <img data-testid="CHAT_MESSAGE_IMAGE">; onError swaps in a 32x32 CHAT_MESSAGE_IMAGE_BROKEN placeholder (webConfigStatics.pastedImage.brokenThumbnailSizePx); click opens a locally-mounted ImageOverlayWidget
  packages/web/src/widgets/chat-message/image-content-layer-widget.proxy.tsx  new
  packages/web/src/widgets/chat-message/image-content-layer-widget.test.tsx   new

GROUP 4  (needs group 3)
  packages/web/src/widgets/chat-message/chat-message-widget.tsx        edit — user branch renders ImageContentLayerWidget instead of the bare <Text>{entry.content}</Text>
  packages/web/src/widgets/chat-message/chat-message-widget.test.tsx   edit — keep every existing user-bubble case green; add image cases
  packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts    edit — (a) sendMessage/sendFollowupMessage write pastedImageMemoryState for the optimistic uuid when `images` present; (b) entriesBySession memo drops a '__no_session__' entry that has an equivalent in any real bucket
  packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.test.ts  edit

GROUP 5  (needs group 4)
  packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.test.tsx  edit — one-bubble-after-replay + url-not-data-url cases
  packages/web/src/widgets/session-view/session-view-widget.test.tsx            edit — CHAT_PANEL present on the session route
  packages/web/src/widgets/app/app-widget.test.tsx                              edit — CHAT_PANEL on both routes (only if app-widget is the route table; otherwise assert per-route widget)

PROVES
  #check-patterns-come-from-shared          -> (read-check) reviewer opens normalise-chat-content-transformer.ts
  #check-both-sides-normalise-alike         -> normalise-chat-content-transformer.test.ts
  #check-trailer-cut-before-compare         -> normalise-chat-content-transformer.test.ts
  #check-text-only-still-compares           -> normalise-chat-content-transformer.test.ts
  #check-token-becomes-img                  -> image-content-layer-widget.test.tsx
  #check-text-renders-around-image          -> image-content-layer-widget.test.tsx
  #check-trailer-not-rendered               -> image-content-layer-widget.test.tsx
  #check-image-sits-between-sentence-halves -> image-content-layer-widget.test.tsx
  #check-bubble-text-matches-composed       -> image-content-layer-widget.test.tsx
  #check-optimistic-shows-image-immediately -> image-content-layer-widget.test.tsx (memory path -> data: src)
  #check-transcript-click-opens-overlay     -> image-content-layer-widget.test.tsx
  #check-broken-thumbnail-in-place          -> image-content-layer-widget.test.tsx (fireEvent.error)
  #check-broken-thumbnail-fixed-size        -> image-content-layer-widget.test.tsx
  #check-other-images-unaffected            -> image-content-layer-widget.test.tsx
  #check-close-button-visible               -> image-overlay-widget.test.tsx
  #check-modal-max-height                   -> image-overlay-widget.test.tsx (declared style value)
  #check-escape-closes-overlay              -> image-overlay-widget.test.tsx
  #check-click-outside-closes-overlay       -> image-overlay-widget.test.tsx
  #check-close-button-closes-overlay        -> image-overlay-widget.test.tsx (already green)
  #check-exactly-one-bubble                 -> quest-chat-content-layer-widget.test.tsx
  #check-surviving-bubble-uses-url          -> quest-chat-content-layer-widget.test.tsx
  #check-replay-frame-sent                  -> session-view-widget.test.tsx (already green)
  #check-entry-lands-in-transcript          -> session-view-widget.test.tsx
  #check-panel-mounts-on-both-routes        -> session-view-widget.test.tsx + quest-chat-content-layer-widget.test.tsx

  #check-modal-is-three-quarters-wide       -> needs a browser (jsdom does no layout; only the declared size string is readable)
  #check-image-fits-modal-width             -> needs a browser
  #check-tall-image-scrolls                 -> needs a browser
  #check-image-get-issued                   -> needs a browser (jsdom never fetches an img src)
  #check-img-actually-loads                 -> needs a browser (jsdom never decodes an image; naturalWidth is always 0)

TRAPS
  - Patterns MUST be read from `pastedImageStatics` (@dungeonmaster/shared/statics). Re-declaring a
    regex literal in web fails the read-check outright.
  - The statics carry pattern STRINGS, not RegExp. Build `new RegExp(pattern, 'gu')` at use.
  - `imageTokenPattern` group 1 = ordinal, group 2 = url/path. `placeholderPattern` group 1 = ordinal.
  - `placeholderPattern` also matches INSIDE an `imageTokenPattern` match. Reduce/consume tokens
    FIRST, then placeholders, or `![Pasted Image 1](url)` becomes `![Pasted Image 1]` + stray `(url)`.
  - jest: no beforeEach/afterEach, no conditionals in tests, fresh proxy per test, toStrictEqual/toBe
    only — no toContain/toMatchObject/toBeDefined/toHaveLength/.not.*.
  - `exactOptionalPropertyTypes`: omit an optional prop, never pass `undefined`.
  - Read a test img's src with `getAttribute('src')`, not `.src` — the IDL property resolves a
    relative URL against jsdom's base and mangles a data URL. ImageOverlayWidgetProxy documents this.
  - Every widget test renders through `mantineRenderAdapter`.
  - git: NEVER `git -C <path> …` and NEVER chain/pipe a git call (`git log … | head`, `git a && git b`)
    — both come back "This command requires approval". Call git bare, one invocation, trim with git's
    own flags (`-n`, `--oneline`, `--stat`, `--name-only`).
