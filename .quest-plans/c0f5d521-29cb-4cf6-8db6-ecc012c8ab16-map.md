# Flowrider map — flow `render-images-in-transcript`

Operation item c0f5d521-29cb-4cf6-8db6-ecc012c8ab16 · 67 units (2 terminal, 7 branch, 58 observable) · 10 walk paths.

## Surfaces (pasted verbatim from get-qa-checklist)

- ui-state → the rendered DOM in a real, attached, VISIBLE browser tab
- api-call → the real HTTP exchange — the method and URL sent, and the real status code and response body read back
- log-output → the real log stream or log file the running process writes
- custom → a BEHAVIOURAL INVARIANT, not an I/O channel — drive the real path that should produce it, inspect the actual result or state it left behind, and reason about whether the invariant held. NEVER reduce it to "a request fired". A content search or static assertion is the correct check ONLY when the observable itself names one (for example "no file still references X"), and then the real output of that search IS the measured value — run it with discover({ grep, strict: true }), since a bare shell grep/rg/find is blocked outright in this repo
- TERMINAL SURFACE → the end state itself — the values the flow says this terminal has, AND its side-effect surface: no orphaned row, no half-written file, the transaction rolled back, the message not silently consumed, no stuck spinner. A clean-looking error that corrupted state is still a defect
- BRANCH SURFACE → the state after this branch was actually taken — the bad value submitted, the rejection triggered, the empty state hit, the limit exhausted. A branch reached by assumption rather than by forcing it has not been measured

## Facts the whole map rests on

| Thing | Value |
|---|---|
| serve route | `GET /api/images?path=<encoded absolute path>` |
| route static | `apiRoutesStatics.images = { serve: pastedImageStatics.serveRoutePath, pathQueryParam: 'path' }` — READ from shared, not retyped |
| shared statics | `pastedImageStatics.serveRoutePath` = `/api/images`; `promptSentinel` = `<!-- dungeonmaster:images -->`; `promptInstruction` = `Read every image referenced above before answering.` |
| token pattern | `imageTokenPattern` = `!\[Pasted Image (\d+)\]\(([^)]+)\)` — group 1 ordinal, group 2 url/path |
| placeholder pattern | `placeholderPattern` = `\[Pasted Image (\d+)\]` — group 1 ordinal |
| allowed extensions | `png`, `jpg`, `jpeg`, `gif`, `webp` |
| content-type map | `.png`→`image/png`, `.jpg`/`.jpeg`→`image/jpeg`, `.gif`→`image/gif`, `.webp`→`image/webp`; anything else → `null` |
| encoding | `encodeURIComponent`, so `/` becomes `%2F` |
| rewritten form | `A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B` |
| replayed user uuid | `` `${lineUuid}:user` `` — built in `parse-user-stream-entry-transformer.ts:119` |
| optimistic uuid | a fresh `crypto.randomUUID()` in the `__no_session__` bucket — never collapses on uuid |
| `replay: true` | set in `ChatReplayResponder`'s `onEntries`, on the `chat-output` emit |
| base URL source | `questGetServerConfigBroker().baseUrl` |
| every refusal | collapses to `404` + zero-length body + NO `Content-Type` header. Never 403, never 400, never 500 |
| guard rejections | not absolute · `..` segment · `\0` · `\n` · `\r` · length > `imageServeStatics.maxPathLength` (4096) |
| dev log | `processDevLogAdapter` writes `[dev] <msg>\n` to stdout ONLY when `process.env.VERBOSE === '1'`; failures log `Image serve failed for …` / `Image read failed for …` |
| broken thumbnail | 32 px × 32 px, from `webConfigStatics.pastedImage.brokenThumbnailSizePx` |
| overlay | Mantine Modal, `size="75%"`, and an inner scroll div at `maxHeight: '90vh'` + `overflowY: 'auto'` |
| web statics | `webConfigStatics.pastedImage` = `{ brokenThumbnailSizePx: 32, overlayWidthPercent: 75, overlayMaxHeightPercent: 90, draftImageStoreName: 'dungeonmaster-chat-draft-images' }` |

### Testids

| Element | Testid |
|---|---|
| message bubble (every role) | `CHAT_MESSAGE` |
| user-content wrapper | `IMAGE_CONTENT_LAYER` |
| a text run inside the bubble | `CHAT_MESSAGE_TEXT` |
| a rendered transcript image | `CHAT_MESSAGE_IMAGE` |
| the 32×32 broken placeholder | `CHAT_MESSAGE_IMAGE_BROKEN` |
| overlay scroll container (carries the 90vh cap) | `IMAGE_OVERLAY` |
| overlay image | `IMAGE_OVERLAY_IMAGE` |
| overlay close control | `IMAGE_OVERLAY_CLOSE` |
| chat panel | `CHAT_PANEL` |
| composer | `CHAT_INPUT` |
| send | `SEND_BUTTON` |
| composer thumbnail | `CHAT_INPUT_THUMBNAIL` |

**The Mantine Modal root carries NO testid.** The 75 % width lives on Mantine's modal *content* element, reachable as `.mantine-Modal-content` — `IMAGE_OVERLAY` is the inner scroll div and measures the 90vh cap, not the width. A spec that measures width off `IMAGE_OVERLAY` is measuring the wrong box.

**Escape and click-outside are Mantine defaults, not hand-wired.** `ImageOverlayWidget` passes only `opened`, `onClose`, `withCloseButton={false}`, `centered`, `size`, `styles`. Both close paths therefore have to be driven in a real browser to be measured at all.

### Routes that mount `CHAT_PANEL`

| Route | Flow file | Notes |
|---|---|---|
| `/:guildSlug/quest/:questId` | `packages/web/src/flows/quest-chat/quest-chat-flow.tsx` | live workspace, composer mounted |
| `/:guildSlug/session/:sessionId` | `packages/web/src/flows/session-view/session-view-flow.tsx` | `readOnly` — transcript only, no `CHAT_INPUT` |

## Layer choice, and why the other track's green does not settle it

Codeweaver proved most `ui-state` units in **jsdom**. jsdom has no layout engine, never fetches an `img` src and never decodes an image, so every painted claim on this flow reads 0 there. Every `ui-state` unit below is therefore measured in a real browser. The same applies to `check-image-get-issued` — jsdom issues no GET at all.

## The replay seam, which is what makes the browser walks possible

`sessionHarness({ guildPath }).createSessionFile({ sessionId, userMessage })` writes
`<HOME>/.claude/projects/<guildPath with / → ->/<sessionId>.jsonl`. `chatHistoryReplayBroker` reads
that exact path: for an orphan session `cwdResolveBroker` finds `.dungeonmaster.json` at the guild
root and hands back `guild.path` unchanged, and `claudeProjectPathEncoderTransformer` applies the
same `/ → -` encoding. The port comes from `portResolveBroker()`, the same call
`server-init-responder` binds with, so the rewritten URL names the RUNNING e2e server.

So a spec can seed a transcript line, navigate to `/:guildSlug/session/:sessionId`, and the browser
receives `A![Pasted Image 1](http://dungeonmaster.localhost:<TEST_PORT>/api/images?path=%2F…)B` and
issues a real GET for it against the real server. Every transcript-side `ui-state` unit is therefore
measured in a real browser, not jsdom.

## Groups

## Two layer decisions, and the recon that forced them

**The `/api/images` HTTP matrix is measured in Playwright, not Jest.** `ServerFlow` calls
`ServerInitResponder` unconditionally, and that binds a real socket, starts a WS upgrade server, an
outbox file watcher, an uncleared `setInterval` and global `SIGTERM`/`SIGINT` handlers that call
`process.exit`. No parameter opts out. So a Jest test can only reach `ImagesFlow()` in isolation, or a
synthetic bare Hono with a stand-in catch-all — which is what the existing test does, and it never
exercises the real assembly. The e2e stack already runs the real server on `TEST_PORT`, so Playwright's
`request` fixture hits the real app with the real SPA catch-all sitting behind the route. That is the
honest surface for `check-route-answers`, and it settles the whole 404 matrix at the same layer.

**The path-encoding matrix is measured as a real round trip in the browser.**
`chat-replay-flow.integration.test.ts` looks like the home for it but is not: all four of its cases use
an unregistered guild and die in `guildGetBroker` before any JSONL is read, and the read path keys off
`osUserHomedirAdapter()` — the real OS home — so building a fixture there risks writing into the
user's actual `~/.claude/projects`. The browser walk already drives that identical path under
Playwright's isolated `HOME`. Seeding a real file whose path contains the hostile character and
asserting the image LOADS proves encode, transmit, decode and serve in one measurement; a `&` that
escapes unencoded splits the query and the GET 404s.

GROUP 1  (below-browser — four different files across three packages, one wave)

  packages/server/src/responders/image/serve/image-serve-responder.test.ts   extend
    check-handler-never-throws  [log-output]  "none of the malformed-path cases above logs an unhandled exception"
       layer:   below-browser
       surface: the real log stream or log file the running process writes
       assert:  `processDevLogAdapterProxy()`, `enableVerbose()`, then drive EVERY malformed case from the checklist through the real responder — traversal, null byte, newline, carriage return, relative, missing param, empty param, over-long. `getWrittenLines()` holds no line matching `Image serve failed` or `Image read failed`. In the SAME test force a genuine read failure so a line DOES appear, proving the reader works and the empty result is not vacuous
       fails if: any malformed case logs, or the positive control logs nothing (a recorder that never records passes a bare "no lines" assertion forever)
       note:    a `.integration.test.ts` may not import a `.proxy.ts` (zero precedent in this package, and the harness import boundary forbids it), which is why this one unit sits in the responder's unit test rather than the flow's integration test. The guard and content-type transformer run REAL on every malformed case — none of them reaches `readFile` at all

  packages/server/src/responders/server/init/server-init-responder.test.ts   extend
    check-server-relays-replay  [api-call]  "the server calls replayChatHistory exactly once for that sessionId"
       layer:   below-browser
       surface: the real HTTP exchange — the method and URL sent, and the real status code and response body read back
       assert:  deliver TWO `replay-history` frames carrying DIFFERENT sessionIds; the recorded replay calls `toStrictEqual` a two-entry list naming each sessionId once. One sessionId alone cannot tell "once" from "once per frame regardless of id"
       fails if: one sessionId is relayed twice, or the second frame's id never arrives
    check-entry-emitted-as-replay  [api-call]  "that entry is emitted as a chat-output event carrying replay true"
       layer:   below-browser
       surface: the real HTTP exchange — …
       assert:  the frame the subscribed client receives parses to a payload whose `replay` is `true` and whose `entries` `toStrictEqual` the entry that went in, content included
       fails if: `replay` is absent or false, or the entries are re-shaped in transit
    check-ws-frame-reaches-client  [api-call]  "the WebSocket frame carrying that entry is delivered to the subscribed client"
       layer:   below-browser
       surface: the real HTTP exchange — …
       assert:  subscribe TWO clients on DIFFERENT chatProcessIds; the frame lands on the one that asked and the other's recorded sends `toStrictEqual` `[]`. Assert the delivered frame's full parsed body, not that send was called
       fails if: both clients receive it, or neither does

  packages/orchestrator/src/responders/chat/replay/chat-replay-responder.test.ts   extend
    check-user-line-yields-one-entry  [custom]  "a JSONL user line whose content is 'A![Pasted Image 1](/p/x.png)B' parses to exactly one chat entry with role user"
       layer:   below-browser
       surface: a BEHAVIOURAL INVARIANT, not an I/O channel — drive the real path that should produce it, inspect the actual result or state it left behind. NEVER reduce it to "a request fired"
       assert:  build the line with `UserTextStringStreamLineStub` (raw inline JSONL is banned in this repo); the captured `chat-output` payload's `entries` has exactly one member, its `role` `toBe` `'user'`, and its `uuid` ends `:user`
       fails if: two entries (the token split the line), or zero
    check-non-image-link-untouched  [custom]  "a markdown link to a .md file in the same message is returned exactly as written"
       layer:   below-browser
       surface: BEHAVIOURAL INVARIANT — …
       assert:  one line carrying BOTH an image token and `[notes](/p/readme.md)`; the emitted content's `.md` link `toBe` byte-identical to what went in, while the image token in the same string DID change. The positive half is what stops a no-op rewriter passing
       fails if: the `.md` link is rewritten, or the image token is not
    check-rewrite-applies-to-session-without-quest  [custom]  "a session replay carrying no questId rewrites its image paths the same way a quest replay does"
       layer:   below-browser
       surface: BEHAVIOURAL INVARIANT — …
       assert:  drive the SAME line twice — once on a session a quest's workItems reference, once on an orphan session — and the two emitted contents `toBe` each other. The orphan payload additionally carries no `questId` key
       fails if: the two differ, or the orphan branch emits nothing at all
    check-payload-carries-http-url  [custom]  "the chat-output payload's content holds an http URL, and holds no bare filesystem path"
       layer:   below-browser
       surface: BEHAVIOURAL INVARIANT — …
       assert:  set `process.env.DUNGEONMASTER_PORT` before the call (`portResolveBroker` reads it at call time) so the URL is deterministic; the emitted content `toBe` the exact full string `A![Pasted Image 1](http://dungeonmaster.localhost:<thatPort>/api/images?path=%2Fp%2Fx.png)B`. Assert the whole string, so a leftover bare path anywhere in it fails
       fails if: the raw `/p/x.png` survives anywhere in the content, or the port is the 3737 default rather than the one that was set
       note:    subscribe with the real `orchestrationEventsState.on({ type: 'chat-output', handler })` singleton

  packages/web/src/transformers/normalise-chat-content/normalise-chat-content-transformer.test.ts   extend
    check-both-sides-normalise-alike  [custom]  "the optimistic content 'A[Pasted Image 1]B' and the transcript content 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B' both normalise to the identical string"
       layer:   below-browser
       surface: a BEHAVIOURAL INVARIANT, not an I/O channel — drive the real path that should produce it, inspect the actual result or state it left behind, and reason about whether the invariant held. NEVER reduce it to "a request fired"
       assert:  drive it through `hasEquivalentChatEntryGuard` — the real comparison point, all 3 call sites — with `entry` = the optimistic entry and `among` = [the transcript entry]; the guard returns true. In the same test assert both `normaliseChatContentTransformer` outputs `toBe` the identical string, naming that string exactly
       fails if: the guard returns false, which is the state that leaves two bubbles on screen forever
    check-trailer-cut-before-compare  [custom]  "transcript content carrying the sentinel line and the read-the-images instruction normalises to the same string as the same message without them"
       layer:   below-browser
       surface: BEHAVIOURAL INVARIANT — …
       assert:  build the trailer from `pastedImageStatics.promptSentinel` + `promptInstruction`, never a typed copy; the normalised form of `<msg>\n\n<!-- dungeonmaster:images -->\nRead every image referenced above before answering.` `toBe` the normalised form of `<msg>`
       fails if: the trailer survives normalisation, so a real CLI-recorded entry never matches its optimistic twin
    check-text-only-still-compares  [custom]  "a message with no images normalises to itself unchanged, so text-only sends keep comparing exactly as they do today"
       layer:   below-browser
       surface: BEHAVIOURAL INVARIANT — …
       assert:  give each input class a hostile member — an unbroken 5000-char token, a string with `\n`, a whitespace-only string, a string holding a literal `[` and `(`, and a string containing the word `Pasted` but no token. Each normalises to itself byte-for-byte
       fails if: any hostile member is altered, which would silently change how every text-only send dedupes

GROUP 2  (browser walk #1 — packages/web · creates the new harness)
  packages/web/src/flows/session-view/transcript-renders-images.e2e.ts   new
    NEW HARNESS: packages/web/test/harnesses/transcript-images/transcript-images.harness.ts
      (this group creates it; groups 3-5 add to it and never edit a sibling flow's harness)
      needs: seedImageFile({ fileName, widthPx, heightPx, seed }) → { imagePath, bytesBase64 },
             removeImageFile({ imagePath }), afterEach cleanup, and page-side readers for
             naturalWidth / child order / boundingBox — a `.e2e.ts` may declare NO function
    check-panel-mounts-on-both-routes  [ui-state]  "CHAT_PANEL renders on /:guildSlug/quest/:questId and on /:guildSlug/session/:sessionId alike"
       layer: browser · surface: the rendered DOM in a real, attached, VISIBLE browser tab
       assert:  navigate BOTH routes in one test; `CHAT_PANEL` is visible on each. On the session route `CHAT_INPUT` has count 0 (it mounts readOnly) and on the quest route count 1 — so the two are shown to be genuinely different pages rather than one route asserted twice
       fails if: either route renders no CHAT_PANEL, or both reads land on the same page
    branch:readable  "file-readable —'readable image'→ serve-bytes"
       layer: browser · surface: BRANCH SURFACE
       assert:  the GET for the seeded path answers 200 with a non-zero body length, and the branch is shown taken by the img reporting non-zero naturalWidth in the same test
       fails if: the response is a 404 — the branch was assumed rather than forced
    check-replay-frame-sent  [api-call]  "the browser sends a replay-history frame carrying the sessionId and guildId for the open view"
       layer: browser · surface: the real HTTP exchange — the method and URL sent, and the real status code and response body read back
       assert:  `page.on('websocket')` + `ws.on('framesent')` recorded BEFORE navigation; exactly one recorded frame parses to `{ type: 'replay-history', sessionId: <the seeded id>, guildId: <the created guild's id>, chatProcessId: 'replay-<sessionId>' }`
       fails if: no frame is sent, or it carries a different sessionId than the open view
    check-entry-lands-in-transcript  [ui-state]  "that entry appears as a rendered CHAT_MESSAGE in the panel"
       layer: browser · surface: the rendered DOM in a real, attached, VISIBLE browser tab
       assert:  exactly one `CHAT_MESSAGE` carrying the seeded text is visible after replay
       fails if: the panel stays empty, or the entry renders twice
    check-token-becomes-img  [ui-state]  "each markdown image token renders as an img element whose src is the URL from the token's parentheses"
       layer: browser · surface: the rendered DOM in a real, attached, VISIBLE browser tab
       assert:  seed TWO tokens with DIFFERENT paths; the two `CHAT_MESSAGE_IMAGE` `getAttribute('src')` values `toStrictEqual` the two full URLs in composed order
       fails if: one src, both srcs equal, or a src that is the bare path rather than the URL
    check-text-renders-around-image  [ui-state]  "the bubble's child order is text 'A', img, text 'B', matching the order the message was composed in"
       layer: browser · surface: …
       assert:  read `IMAGE_CONTENT_LAYER`'s direct children as a `[tag, text]` list; it `toStrictEqual` `[['span','A'],['img',''],['span','B']]` for the seeded content `A![Pasted Image 1](<p>)B`
       fails if: the img lands before or after both text runs
    check-image-sits-between-sentence-halves  [ui-state]  "for the message 'this image A vs this image B' the two images render between their respective sentence halves, in composed order"
       layer: browser · surface: …
       assert:  seed `this image ![Pasted Image 1](<p1>) vs this image ![Pasted Image 2](<p2>)`; the child list `toStrictEqual` the exact 4-entry text/img/text/img sequence, and img 1's src is p1's URL while img 2's is p2's — two DIFFERENT seeds so a swap is visible
       fails if: both images are hoisted to the end, or the two srcs are swapped
    check-bubble-text-matches-composed  [ui-state]  "stripping the img elements from the bubble leaves exactly the text that was typed, with no leftover token characters"
       layer: browser · surface: …
       assert:  join the bubble's text nodes; the result `toBe` `'this image  vs this image '` exactly — no `!`, `[`, `]`, `(`, `)`, no `Pasted Image`, no `http`
       fails if: any bracket, the word `Pasted`, or any part of the URL survives in the text
    check-trailer-not-rendered  [ui-state]  "content following the <!-- dungeonmaster:images --> sentinel appears nowhere in the rendered bubble"
       layer: browser · surface: …
       assert:  seed a line whose content carries the token AND the real trailer built from `pastedImageStatics`; the bubble's full text `toBe` the pre-sentinel text exactly, and a locator for the instruction sentence has count 0. The positive half — the image still renders — sits in the same test so the 0 is not vacuous
       fails if: the sentinel comment or the instruction sentence is visible to the user
    check-img-actually-loads  [ui-state]  "the rendered img fires load and reports a non-zero naturalWidth"
       layer: browser · surface: …
       assert:  `page.bringToFront()`, `page.screenshot()`, assert `document.visibilityState` is `'visible'`, THEN read `naturalWidth`; it `toBe` the exact pixel width the harness seeded the PNG at
       fails if: 0 — which is what a 404, a wrong Content-Type, or an unmounted route all produce
    terminal:images-visible  "Message reads back exactly as it was composed"
       layer: browser · surface: TERMINAL SURFACE
       assert:  all at once on the two-image message — 2 imgs both with non-zero naturalWidth, the stripped text equal to the composed text, `CHAT_MESSAGE` count exactly 1 (not a duplicate), `CHAT_MESSAGE_IMAGE_BROKEN` count 0, and no console error recorded during the walk
       fails if: any one of them — especially a second bubble, or a broken placeholder on a path that exists

GROUP 3  (browser walk #2 — packages/web · NEVER beside group 2)
  packages/web/src/flows/session-view/transcript-image-overlay.e2e.ts   new
    branch:inline-to-click  "render-inline —'clicks image'→ click-thumbnail"
       layer: browser · surface: BRANCH SURFACE
       assert:  before the click `IMAGE_OVERLAY` has count 0; after clicking `CHAT_MESSAGE_IMAGE` it has count 1 — the branch forced, not assumed
       fails if: the overlay was already open, so the click proved nothing
    check-transcript-click-opens-overlay  [ui-state]  "clicking an image inside a rendered message opens the full-size overlay showing that image"
       layer: browser · surface: the rendered DOM in a real, attached, VISIBLE browser tab
       assert:  seed TWO images; click the SECOND; `IMAGE_OVERLAY_IMAGE`'s src `toBe` the second image's URL
       fails if: the overlay opens on the first image — which one image alone could never catch
    check-modal-is-three-quarters-wide  [ui-state]  "the modal's rendered width equals 75 percent of the viewport width"
       layer: browser · surface: …
       assert:  bringToFront + screenshot + visibilityState 'visible' FIRST. Then `Math.round(boundingBox().width)` of `.mantine-Modal-content` `toBe` `Math.round(viewportWidth * 0.75)`. Measure at TWO viewport widths in the same test so a fixed px size cannot pass
       fails if: the width is a constant across the two viewports
    check-modal-max-height  [ui-state]  "the modal's max height is 90 percent of the viewport height"
       layer: browser · surface: …
       assert:  computed `maxHeight` of `IMAGE_OVERLAY` resolves to `Math.round(viewportHeight * 0.90)` px
       fails if: it resolves to `none`, or to a fixed px value that ignores the viewport
    check-image-fits-modal-width  [ui-state]  "the image's rendered width is at most the modal's content width, for an image wider than the viewport"
       layer: browser · surface: …
       assert:  seed a PNG WIDER than the viewport; `IMAGE_OVERLAY_IMAGE` boundingBox().width is <= `.mantine-Modal-content` boundingBox().width, and its naturalWidth is greater than the viewport width — so the image really was oversized
       fails if: the rendered width equals naturalWidth, i.e. it overflows the browser
    check-tall-image-scrolls  [ui-state]  "an image taller than 90 percent of the viewport leaves the modal body scrollable, with the modal itself no taller than that 90 percent"
       layer: browser · surface: …
       assert:  seed a PNG taller than the viewport; `IMAGE_OVERLAY`'s `scrollHeight` is greater than its `clientHeight` (it really can scroll) AND its boundingBox().height is <= `Math.round(viewportHeight * 0.90)`
       fails if: scrollHeight equals clientHeight (nothing to scroll) or the box exceeds the cap
    check-close-button-visible  [ui-state]  "a close control is visible on the modal"
       layer: browser · surface: …
       assert:  `IMAGE_OVERLAY_CLOSE` is visible AND its boundingBox has non-zero width and height — the widget passes `withCloseButton={false}` to Mantine, so this control is its own and a zero box is the real risk
       fails if: count 0, or a zero-area box
    check-escape-closes-overlay  [ui-state]  "pressing Escape removes the overlay and leaves the transcript visible"
       layer: browser · surface: …
       assert:  after Escape, `IMAGE_OVERLAY` count 0 AND `CHAT_MESSAGE` still visible with its image still loaded
       fails if: the overlay stays, or the transcript unmounts with it
    check-click-outside-closes-overlay  [ui-state]  "clicking outside the image removes the overlay"
       layer: browser · surface: …
       assert:  click at a viewport corner outside `.mantine-Modal-content`; `IMAGE_OVERLAY` count 0. First assert a click ON the image leaves it OPEN, so "outside" is shown to be what mattered
       fails if: any click anywhere closes it, or the outside click does not
    check-close-button-closes-overlay  [ui-state]  "clicking the close control removes the overlay"
       layer: browser · surface: …
       assert:  click `IMAGE_OVERLAY_CLOSE`; `IMAGE_OVERLAY` count 0 and the transcript image is still rendered
       fails if: the overlay survives the click

GROUP 4  (browser walk #3 — packages/web · NEVER beside groups 2/3 · TWO files, ONE agent, ONE ward run)

  packages/web/src/flows/session-view/image-route-answers.e2e.ts   new
    Uses Playwright's `request` fixture (APIRequestContext) against the REAL running server on
    TEST_PORT — the real assembly, with the real SPA catch-all behind the route. No page needed.
    check-route-answers  [api-call]  "the server has a registered handler for /api/images that answers rather than falling through to the SPA catch-all"
       layer: browser · surface: the real HTTP exchange — the method and URL sent, and the real status code and response body read back
       assert:  GET the seeded path against the real server: status 200, `Content-Type` `image/png`, and the body bytes equal the seeded bytes. In the SAME test GET an unrouted `/api/definitely-not-a-route` and show it answers differently — that contrast is what proves this route was matched rather than swallowed. Every refusal here is a 404, so a 404 alone can never tell "not mounted" from "refused": the mount proof must be a 200 WITH BYTES
       fails if: the 200 body is HTML (the SPA fell through), or the route 404s
    check-bytes-match-disk  [api-call]  "the response body's bytes equal the file's bytes on disk"
       layer: browser · surface: the real HTTP exchange — …
       assert:  seed a PNG with a hostile byte profile — a null byte, a `0xFF` run and a trailing newline in the pixel data — then `toStrictEqual` the response body against the seeded bytes. A text-safe payload would pass even through a utf8 read that corrupts binary
       fails if: any byte differs, or the length differs
    check-png-content-type  [api-call]  "a .png path answers with Content-Type image/png"
       layer: browser · surface: … · assert: header `toBe` `'image/png'` · fails if: `application/octet-stream`, or the header is absent
    check-webp-content-type  [api-call]  "a .webp path answers with Content-Type image/webp"
       layer: browser · surface: … · assert: header `toBe` `'image/webp'` for a seeded `.webp` · fails if: it answers `image/png` for every extension
    check-never-403  [api-call]  "no request to this route answers 403, whatever path it carries"
       layer: browser · surface: … · assert: collect the status of EVERY case this file drives — the 200s and all ten refusals — into one list and assert it holds only 200 and 404 · fails if: any 403, or any 500
    The refusal matrix — ONE `test.each` over the ten cases, each asserting
    `{ status: 404, byteLength: 0, contentType: null }` in a single `toStrictEqual`:
    check-traversal-segments-404   "path=/a/../../../../etc/passwd answers 404 and returns zero bytes of that file"
       assert: 404, zero bytes, and the body does not begin `root:` · fails if: any byte of the real file comes back
    check-null-byte-404            "a path whose decoded value contains a null byte answers 404 rather than throwing or truncating the path at the null"
       assert: send `<seeded real png path>%00.txt`; 404 and zero bytes · fails if: 200 — meaning the path was truncated at the null and the real file was served
    check-newline-in-path-404      "a path whose decoded value contains a newline or carriage return answers 404 and writes nothing to the response headers from that value"
       assert: drive `\n` AND `\r` as separate cases; 404, and no response header's value contains any part of the injected string · fails if: an injected header appears
    check-relative-path-404        "a path that is not absolute answers 404 rather than resolving against the server's working directory"
       assert: send a relative path that WOULD resolve to a real readable file from the server's cwd; 404 and zero bytes · fails if: 200 — the cwd was used as a base
    check-missing-param-404        "a request with no path parameter at all answers 404 and does not throw"
       assert: GET the bare route with no query string; 404, zero bytes · fails if: 500
    check-empty-param-404          "path= with an empty value answers 404" · fails if: 200 or 500
    check-overlong-path-404        "a path longer than any real filesystem path answers 404 without the handler throwing"
       assert: a path one character longer than `imageServeStatics.maxPathLength`, read from the static rather than typed; 404 · fails if: 500, or 200
    check-missing-file-404         "a path pointing at no file answers 404"
       assert: an absolute `.png` path inside a real seeded directory that was never created · fails if: anything but 404
    check-non-image-extension-404  "path=/etc/passwd answers 404 and returns zero bytes of that file"
       assert: 404, zero bytes, body does not begin `root:` · fails if: any content of the real file is returned

  packages/web/src/flows/session-view/transcript-broken-image.e2e.ts   new
    branch:not-readable  "file-readable —'missing, unreadable or not an image'→ image-not-served"
       layer: browser · surface: BRANCH SURFACE
       assert:  seed a token pointing at a path that does NOT exist; the recorded response for that GET has status 404 and zero body bytes — the branch forced through a real request
       fails if: the request never fires or answers 200
    check-broken-thumbnail-in-place  [ui-state]  "that placeholder sits where the image sat, and the text on both sides of it still renders"
       layer: browser · surface: the rendered DOM in a real, attached, VISIBLE browser tab
       assert:  for content `A![Pasted Image 1](<missing>)B` the `IMAGE_CONTENT_LAYER` child list `toStrictEqual` `[['span','A'],['span',''],['span','B']]` with the middle child carrying testid `CHAT_MESSAGE_IMAGE_BROKEN`
       fails if: the placeholder is appended at the end, or either text run disappears
    check-broken-thumbnail-fixed-size  [ui-state]  "the broken-image placeholder renders at exactly 32 px wide and 32 px tall, so a failed image cannot stretch the bubble"
       layer: browser · surface: …
       assert:  bringToFront + screenshot + visibilityState first; `CHAT_MESSAGE_IMAGE_BROKEN` boundingBox() `toStrictEqual` width 32 and height 32, read against `webConfigStatics.pastedImage.brokenThumbnailSizePx` rather than a typed 32
       fails if: either dimension differs, or the box is 0
    check-other-images-unaffected  [ui-state]  "in a message holding two images where only one fails, the other still loads at its natural size"
       layer: browser · surface: …
       assert:  one token at a REAL seeded path, one at a missing path, in one message; `CHAT_MESSAGE_IMAGE` count 1 with naturalWidth equal to the seeded pixel width, and `CHAT_MESSAGE_IMAGE_BROKEN` count 1 — both in the same bubble
       fails if: the good image also collapses, or both render broken
    terminal:image-not-served  "404 returned, thumbnail shows its broken state in place"
       layer: browser · surface: TERMINAL SURFACE
       assert:  all at once — the GET answered 404 with zero bytes and NO Content-Type header, the placeholder is 32×32 in position, the surrounding text is intact, `CHAT_MESSAGE` count is still exactly 1, and no unhandled console error was recorded. A clean 404 that blanked the bubble is still a defect
       fails if: any one — especially a whole bubble lost to one missing file

GROUP 5  (browser walk #4 — packages/web · NEVER beside groups 2/3/4)
  packages/web/src/flows/session-view/transcript-image-path-encoding.e2e.ts   new
    Every case is ONE real round trip: seed a REAL image file at a path containing the hostile
    character, seed a transcript line whose token names that path, open the session view, and assert
    the image LOADS. That measures encode, transmit, decode and serve together — a character that
    escapes unencoded 404s and the thumbnail breaks, so each case is falsifiable by construction.
    check-path-becomes-query-url  [custom]  "content 'A![Pasted Image 1](/p/x.png)B' becomes 'A![Pasted Image 1](http://dungeonmaster.localhost:<port>/api/images?path=%2Fp%2Fx.png)B'"
       layer: browser · surface: a BEHAVIOURAL INVARIANT — drive the real path that should produce it, inspect the actual result
       assert:  the rendered img's `getAttribute('src')` `toBe` the full URL built from the harness's own knowledge of TEST_PORT and the seeded absolute path — origin, `/api/images`, and `path=` equal to `encodeURIComponent(seededPath)`, asserted as one whole string
       fails if: the origin names the vite port rather than the api port, or `/` survives unencoded as `%2F` was expected
    check-image-get-issued  [api-call]  "the browser issues GET /api/images with a path query parameter holding the percent-encoded absolute path"
       layer: browser · surface: the real HTTP exchange — the method and URL sent, and the real status code and response body read back
       assert:  `page.waitForRequest` records method GET, and the `path` value read RAW off the query string (not through `URLSearchParams`, which would decode it and hide the bug) `toBe` `encodeURIComponent(seededPath)`; that request's response status `toBe` 200
       fails if: no GET fires, or the raw query holds an unencoded character
    The encoding matrix — ONE `test.each`, one seeded file per character, each asserting the image
    loads with non-zero naturalWidth AND the raw query value holds the named escape:
    check-space-encoded         "a path containing a space becomes %20 in the query value"          · fails if: the raw value holds a literal space or a `+`
    check-ampersand-encoded     "a path containing & becomes %26, so it cannot start a second query parameter"
       assert: the raw value holds `%26`, the request carries exactly ONE query parameter, and the image loads · fails if: a bare `&` splits the query and the server sees a truncated path
    check-hash-encoded          "a path containing # becomes %23, so the rest of the path is not read as a fragment"
       assert: `%23` present, image loads · fails if: a bare `#` truncates the path and the GET 404s
    check-question-mark-encoded "a path containing ? becomes %3F"                                    · fails if: a bare `?` starts a second query string
    check-percent-encoded       "a path containing a literal % becomes %25, so decoding once returns the original path rather than mangling it"
       assert: seed the path with `%41` in it — decoding a single-encoded value would turn it into `A` and name a DIFFERENT file. `%2541` is present in the raw value and the image loads · fails if: the wrong file is served, or a 404
    check-plus-encoded          "a path containing + becomes %2B rather than surviving as a character that decodes back to a space"
       assert: `%2B` present, image loads · fails if: the raw value holds a bare `+` and the served path has a space where the `+` was
    check-non-ascii-encoded     "a path containing a non-ASCII character round-trips: encoding then decoding the query value returns the original path exactly"
       assert: seed a filename holding a non-ASCII character; `decodeURIComponent(rawQueryValue)` `toBe` the seeded path exactly, and the image loads · fails if: the decoded value is mojibake, or the GET 404s

GROUP 6  (browser walk #5 — packages/web · NEVER beside groups 2/3/4/5)
  packages/web/src/flows/quest-chat/transcript-replaces-optimistic.e2e.ts   new
    branch:open-to-normalise  "open-chat-view —'message just sent from this browser'→ normalise-for-comparison"
       layer: browser · surface: BRANCH SURFACE
       assert:  paste an image and send from the quest composer; before any transcript entry arrives exactly 1 `CHAT_MESSAGE` carrying that text is present — the just-sent branch entered
       fails if: 0 bubbles (nothing optimistic) or 2 (the compare never ran)
    branch:origin-live  "entry-origin —'no transcript entry yet'→ render-from-memory"
       layer: browser · surface: BRANCH SURFACE
       assert:  in the window before the replayed entry lands, the single bubble's img src starts `data:` — the memory branch, not the URL branch
       fails if: the src is an http URL, meaning the optimistic path was skipped
    check-optimistic-shows-image-immediately  [ui-state]  "immediately after send the user bubble shows the image, with its src a data URL and no GET issued for it"
       layer: browser · surface: the rendered DOM in a real, attached, VISIBLE browser tab
       assert:  the img's `getAttribute('src')` starts `data:image/png;base64,` AND the recorded count of GETs to `/api/images` is 0 at that moment. Read with `getAttribute`, never `.src`, which resolves against the base URL and mangles a data URL
       fails if: a GET fired before the transcript entry arrived, or the bubble showed no image at all
    branch:memory-recheck  "render-from-memory —'transcript entry arrives'→ entry-origin"
       layer: browser · surface: BRANCH SURFACE
       assert:  record the bubble count and the img src continuously; the sequence shows the data-URL state FIRST and the URL state AFTER, proving the recheck ran rather than the page rendering the final state once
       fails if: the recording only ever holds one state
    branch:origin-replay  "entry-origin —'transcript entry present'→ drop-optimistic"
       layer: browser · surface: BRANCH SURFACE
       assert:  after the replayed entry lands, the surviving bubble is the transcript one — its img src is the `/api/images` URL and the earlier data URL is gone from the DOM
       fails if: the data URL bubble is the survivor
    check-exactly-one-bubble  [ui-state]  "once the transcript entry arrives, exactly one CHAT_MESSAGE with that text is rendered, not two"
       layer: browser · surface: …
       assert:  `CHAT_MESSAGE` filtered to that message text `toHaveCount` 1 after the entry lands. This is the whole point of the normaliser: the two raw strings differ by both the URL rewrite and the trailer, so a broken normaliser leaves 2
       fails if: 2 — the defect design decision #optimistic-entry-is-replaced-not-duplicated exists to kill
    check-surviving-bubble-uses-url  [ui-state]  "the surviving bubble's image src is the /api/images URL, not the data URL it started with"
       layer: browser · surface: …
       assert:  the surviving img's `getAttribute('src')` starts `http://` and contains `/api/images?path=`, and the GET for it answered 200 with non-zero bytes — so the URL is live, not merely present
       fails if: the src still starts `data:`

## Coverage ledger — all 67 units allocated, none twice

| Group | Wave | Units |
|---|---|---|
| 1 · below-browser, 4 files | 1 | 11 |
| 2 · `transcript-renders-images.e2e.ts` + new harness | 2 | 11 |
| 3 · `transcript-image-overlay.e2e.ts` | 3 | 10 |
| 4 · `image-route-answers.e2e.ts` + `transcript-broken-image.e2e.ts` | 4 | 19 |
| 5 · `transcript-image-path-encoding.e2e.ts` | 5 | 9 |
| 6 · `transcript-replaces-optimistic.e2e.ts` | 6 | 7 |
| | | **67** |

2 terminals, 7 branches, 58 observables. Group 2 creates the transcript-images harness, so it runs
before groups 3-6, which add to it. Group 1 touches no web e2e file and could run beside group 2, but
runs first so the below-browser proofs are in before any browser wave.

## The one unit most likely to come back NOT PROVED

`check-exactly-one-bubble` (group 6) needs the whole loop: paste, send, the server writes the file and
rewrites the token, the fake CLI records the prompt WITH its trailer into a session JSONL, the watcher
tails it, the orchestrator rewrites the path to a URL, and the binding's normalised-equality filter
drops the optimistic twin. Every earlier group proves one link; only this one proves them joined. If it
cannot be driven, the sub-agent reports NOT PROVED with the observed bubble count and both raw content
strings — it does not commit a red test and I do not sign the unit.

## MIRROR

- `packages/server/src/flows/images/images-flow.integration.test.ts` — real temp file via `serverAppHarness().seedImageFile`, `app.request()`, status + bytes + content-type read back
- `packages/web/src/flows/quest-chat/composer-paste-draft-reload.e2e.ts` — every browser group: seeding, claudeMock, waitForRequest/waitForResponse, Node-side fs reads
- `packages/web/src/flows/quest-chat/send-images-chat-route.e2e.ts` — the most recent browser walk on this quest

## TRAPS

- A `.e2e.ts` may declare NO function — `forbid-non-exported-functions` blocks the write outright. Anything computed goes in a `.harness.ts`.
- Never edit `playwright.config.ts`, `composer-paste.harness.ts`, `composer-send.harness.ts`, `claude-mock.harness.ts`, `quest.harness.ts` or `followup.harness.ts` — sibling flows own them. New reads go in a harness this operation creates.
- Never two browser walks against `packages/web` in one wave — Playwright writes one report path per package and the second run overwrites the report the first is still reading.
- Bring the page to front, take a screenshot to force a frame, and assert `document.visibilityState === 'visible'` BEFORE any `boundingBox()`, width, height, overflow or visibility read. A backgrounded tab reads invisible with a zero-ish box, which looks exactly like a product bug.
- `page.route` is banned. Observe with `waitForRequest` / `waitForResponse` / `page.on('request')`.
- `placeholderPattern` also matches INSIDE an `imageTokenPattern` match. Consume tokens FIRST, then placeholders.
- The statics carry pattern STRINGS, not RegExp. Build `new RegExp(pattern, 'gu')` at use.
- Read a test img's src with `getAttribute('src')`, not `.src` — the IDL property resolves against the base URL and mangles a data URL.
- Seed TWO images wherever an assertion has to tell one from the other, built from DIFFERENT seeds. Byte-identical images make an order or identity assertion unfalsifiable.
- Every refusal on `/api/images` answers 404, so a route that was never mounted is indistinguishable from one that refused. The mount proof needs a 200 WITH BYTES.
- `exactOptionalPropertyTypes` is on: omit an optional property, never pass `undefined`.
- jest: no `beforeEach`/`afterEach`, no conditionals in a test body, fresh proxy per test, `toStrictEqual`/`toBe` only — no `toContain`/`toMatchObject`/`toBeDefined`/`toHaveLength`/`.not.*`.
- `enforce-test-single-proxy-import` blocks a test file from importing any proxy but its own colocated one, and the pre-edit hook refuses the write. To reach another adapter's proxy, COMPOSE it inside the colocated proxy and expose semantic methods — `server-init-responder.proxy.ts` already does this for `processDevLogAdapterProxy`. A brief that tells a sub-agent to import a foreign proxy into a test is telling it to do something the hook will refuse.
- `jest/max-expects` caps a test at 5 `expect` calls. A matrix that needs more per case belongs in `it.each`, one case per row.
- git: NEVER `git -C <path> …` and NEVER chain a git call with `&&` or pipe it — both come back "This command requires approval". Call git bare, one invocation, trimmed with git's own flags (`-n`, `--oneline`, `--stat`, `--name-only`).
