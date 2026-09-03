# Walker Guide — paste-image-into-composer

Server under test: `http://dungeonmaster.localhost:4751` (the repo's `npm run dev` — web on 4751,
API on 4750, `/api` and `/ws` are Vite-proxied through 4751 so either base works). Its
`DUNGEONMASTER_HOME` is `<repoRoot>/.dungeonmaster-dev` (confirmed: `GET /api/guilds` on 4751
returns `[]`, and this worktree's `.dungeonmaster-dev/guilds` dir exists and is empty). Do not start,
stop, or restart it.

## TOOLING

- Composer DOM, paste-event synthesis, IndexedDB, localStorage, caret placement — all driven from
  the page via `mcp__claude-in-chrome__javascript_tool`. Load the browser tool set first:
  `ToolSearch({query: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__tabs_close_mcp"})`.
- Guild/quest seeding and reset — `curl` against `http://dungeonmaster.localhost:4751/api/...` (see
  SEEDING/RESET). No auth headers needed.
- Quest/guild files on disk (the `file-exists` check surface, e.g. quest images dir) —
  `<repoRoot>/.dungeonmaster-dev/guilds/<guildId>/quests/<questFolder>/quest.json` and
  `.../images/`. Read with the `Read` tool or `ls`/`python3 os.walk` via Bash (native `find`/`grep`
  are blocked in this repo — see the session's discover-tool guidance).
- Session JSONL (only needed if a path wants a real `--resume`, see SEEDING) —
  `$HOME/.claude/projects/<guildPath with every / replaced by ->/<sessionId>.jsonl`.
- Outbox line the server's watcher reconciles on — append to
  `<repoRoot>/.dungeonmaster-dev/event-outbox.jsonl` (one JSON line
  `{"questId":"<id>","timestamp":"<ISO>"}`) whenever quest.json is hand-edited, or the UI will not
  see the change until its ~3s fallback poll.
- Dev server log file: **NOT FOUND — walker must work this out.** `npm run dev` writes `[dev]`-prefixed
  lines to whichever terminal invoked it (VERBOSE=1); nothing in this repo redirects that stdout to a
  file, and this flow never needs it anyway — every OBSERVABLE below is either DOM, IndexedDB,
  localStorage, or one network request/response.

## ENTRY

- **Create-quest composer** (no quest yet — this is what P1–P6, P8–P10, P12 use):
  `http://dungeonmaster.localhost:4751/{urlSlug}/quest` — `CHAT_INPUT` mounts immediately with no
  quest required.
- **Existing-quest composer** (P7, P11 need a real `questId` to send to):
  `http://dungeonmaster.localhost:4751/{urlSlug}/quest/{questId}`.
- No login, no feature flag. `urlSlug` = the guild's `name`, lowercased, spaces → hyphens (or read
  `urlSlug` straight off the `POST /api/guilds` response).
- Wait for `[data-testid="CHAT_INPUT"]` to be visible before pasting anything — both routes fetch
  `/api/guilds` on mount and the composer isn't in the DOM until that resolves.

## SEEDING

**Every path needs a guild.** One guild is enough for the whole walk; give each `describe`-sized
group of paths its own guild path only if you want a clean slate between them.

```bash
mkdir -p /tmp/dm-walker-paste-composer
curl -s -X POST http://dungeonmaster.localhost:4751/api/guilds \
  -H 'Content-Type: application/json' \
  -d '{"name":"Walker Paste Composer Guild","path":"/tmp/dm-walker-paste-composer"}'
```

Response is `{"id": "...", "urlSlug": "...", "name": "...", "path": "...", ...}` — capture `id` and
`urlSlug`. (Guild creation is directory-bookkeeping only, not a git operation — the git-fixture-repo
dance in `environmentHarness` exists for the `riftcarver` quest-*start* step, which this flow never
reaches.)

**P1–P6, P8–P10, P12** (no real quest needed): navigate straight to `/{urlSlug}/quest`. Nothing
further to seed on the server side — but do NOT assume the composer starts empty just because the
page is freshly navigated: a prior walk's draft can already be RESTORED into the live DOM by the time
you look (a walker got a baseline of 1 thumbnail and the text "Z hello" left over from an earlier
walk this way). Before trusting the composer as empty, run `window.__dm.clearStorage()`, THEN reload
the page, THEN confirm `window.__dm.readChildren().length === 0` and
`window.__dm.readDraftText() === null` — `clearStorage()` alone, without the reload+confirm, is not
enough (see RESET).

**Two byte-distinct images**, whenever a check needs to tell two thumbnails apart (e.g.
check-two-images-keep-their-places, check-same-clipboard-twice-*): build two data URLs with
different `seed` values via `buildImageDataUrl` (see FORCING) — different seeds paint a different
fill colour and corner notch, so they can never encode to the same bytes even at identical
dimensions.

**P7, P11** (draft survives reload, then gets sent) need a real quest:

```bash
curl -s -X POST http://dungeonmaster.localhost:4751/api/quests \
  -H 'Content-Type: application/json' \
  -d '{"guildId":"<guildId>","title":"Walker Draft Reload Quest","userRequest":"Build feature"}'
```

Response carries `questId`, `questFolder`, `filePath` (quest.json's absolute path). The
freshly-created quest.json is not yet in a state `ChatInputWidget`'s send path can rely on for this
walk, so overwrite it directly (mirrors `composer-paste-draft-reload.e2e.ts`'s
`quests.writeQuestFile`) — write this exact shape to `<filePath>`, substituting `id`/`folder`:

```json
{
  "id": "<questId>",
  "folder": "<questFolder>",
  "title": "Walker Draft Reload Quest",
  "status": "explore_flows",
  "createdAt": "2026-09-02T00:00:00.000Z",
  "workItems": [
    {
      "id": "e2e00000-0000-4000-8000-0000000000d1",
      "role": "chaoswhisperer",
      "status": "complete",
      "spawnerType": "agent",
      "createdAt": "2026-09-02T00:00:00.000Z",
      "relatedDataItems": [],
      "dependsOn": [],
      "attempt": 0,
      "maxAttempts": 1
    }
  ],
  "userRequest": "Build feature",
  "designDecisions": [],
  "steps": [],
  "toolingRequirements": [],
  "packagesAffected": [
    { "name": "auth-service", "location": "./packages/auth-service", "changeType": "edit", "packageType": "library" }
  ],
  "contracts": [],
  "planningNotes": {},
  "flows": [
    {
      "id": "harness-flow",
      "name": "Harness Flow",
      "flowType": "runtime",
      "entryPoint": "start",
      "exitPoints": ["end"],
      "nodes": [
        { "id": "start", "label": "Start", "type": "state", "packages": ["auth-service"], "observables": [] },
        { "id": "end", "label": "End", "type": "terminal", "packages": ["auth-service"], "observables": [] }
      ],
      "edges": [{ "id": "start-to-end", "from": "start", "to": "end" }]
    }
  ],
  "wardResults": [],
  "operations": []
}
```

Deliberately **no `sessionId` on the workItem** — `quest-chat-responder.ts` only tries `--resume`
when it finds a chat workItem carrying one; omitting it makes every send on this quest a fresh spawn,
which is all P7/P11 need (they assert the POST body and the images written to disk, not a real agent
reply) and skips having to hand-author a session JSONL. Then append the outbox line so the server's
watcher notices without waiting on its poll:

```bash
printf '{"questId":"<questId>","timestamp":"2026-09-02T00:00:00.000Z"}\n' \
  >> /home/brutus-home/projects/codex-of-consentient-craft/worktrees/try-2-paste-images-into-web-chat-render-inline-s-1be07040/.dungeonmaster-dev/event-outbox.jsonl
```

Navigate to `/{urlSlug}/quest/{questId}` and wait for `CHAT_INPUT`.

## RESET

```bash
GUILD_IDS=$(curl -s http://dungeonmaster.localhost:4751/api/guilds | python3 -c "import json,sys; print('\n'.join(g['id'] for g in json.load(sys.stdin)))")
for id in $GUILD_IDS; do curl -s -X DELETE "http://dungeonmaster.localhost:4751/api/guilds/$id"; done
```

Deletes every guild directory under `.dungeonmaster-dev/guilds/` (quest.json, images, everything
under that guild). **What it does NOT reset:**

- **Browser storage.** `localStorage['dungeonmaster-chat-draft']` and the
  `dungeonmaster-chat-drafts` IndexedDB database survive both a page reload and a guild delete —
  clear them explicitly from the page:
  `localStorage.clear(); indexedDB.deleteDatabase('dungeonmaster-chat-drafts');` (or
  `window.__dm.clearStorage()`, see FORCING). **`clearStorage()` ALONE does not give you a fresh
  composer.** A prior walk's draft may already have been RESTORED into the live DOM before
  `clearStorage()` ran, so the composer still shows those old thumbnails/text even though the
  underlying stores are now empty (a walker started a run with 2 stray thumbnails and the text "Z
  hello" left over from an earlier walk this way). The rule: `clearStorage()`, THEN a page reload,
  THEN confirm `window.__dm.readChildren().length === 0` and `window.__dm.readDraftText() === null`
  before trusting the composer as empty.
- **Session JSONL files** under `$HOME/.claude/projects/<encoded guildPath>/` — these live outside
  `DUNGEONMASTER_HOME` entirely and a guild delete never touches them. Only matters if you reuse the
  same guild `path` across walks; `rm -rf` that directory by hand if so.
- **Toasts already shown** — Mantine notifications auto-dismiss on their own timer, not on any reset
  action; wait them out or `page.reload()`.

If the session's Bash tool is denied outright, the same guild list/create/delete calls work as
`fetch()` run from the page via `javascript_tool` — no `curl`, no `mkdir -p` needed (`POST
/api/guilds` returns 201 without the guild path pre-existing on disk):

```js
await fetch('http://dungeonmaster.localhost:4751/api/guilds').then((r) => r.json());
await fetch('http://dungeonmaster.localhost:4751/api/guilds', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Walker Paste Composer Guild', path: '/tmp/dm-walker-paste-composer' }),
}).then((r) => r.json());
await fetch('http://dungeonmaster.localhost:4751/api/guilds/<id>', { method: 'DELETE' });
```

## CONTROLS

- `[data-testid="CHAT_INPUT"]` — the contenteditable composer. `contenteditable="true"` when idle.
- `[data-testid="CHAT_INPUT_THUMBNAIL"]` — every inserted image thumbnail (`<img>`, always
  `contenteditable="false"`, zero child elements, zero `<button>` anywhere inside it — there is no
  in-composer remove control, only Backspace/Delete). Also carries `data-attachment-id="<uuid>"`.
- `[data-testid="CHAT_INPUT_PLACEHOLDER"]` — "Describe your quest..." ghost text, present only while
  the composer is empty.
- `[data-testid="CHAT_INPUT_UPLOAD_PROGRESS"]` — the byte-tracked bar shown only while a send with
  images is in flight.
- `[data-testid="SEND_BUTTON"]` — visible when not streaming; disabled while a send is in flight.
- `[data-testid="STOP_BUTTON"]` — replaces SEND_BUTTON while `isStreaming`.
- `[data-testid="IMAGE_OVERLAY"]` — the full-size modal body, mounted only once a thumbnail has been
  clicked (absent — zero count — before any click).
- `[data-testid="IMAGE_OVERLAY_IMAGE"]` — the `<img>` inside the overlay; its `src` should equal the
  clicked thumbnail's `src`.
- `[data-testid="IMAGE_OVERLAY_CLOSE"]` — the X button that closes the overlay.
- Toast text renders as plain Mantine notification body text — locate with
  `page.getByText(...)`-equivalent (`find` tool or `read_page` text search), not a testid.

## OFF-SCREEN

- **localStorage** (`dungeonmaster-chat-draft`) — text half of the draft, with each pasted image
  represented inline as a `[Pasted Image N]` token (1-based, insertion order). Read via
  `javascript_tool`: `localStorage.getItem('dungeonmaster-chat-draft')`.
- **IndexedDB** (`dungeonmaster-chat-drafts` v1, store `dungeonmaster-chat-draft-images`) — image
  half of the draft: one record per attachment, `{attachmentId, mediaType, dataBase64}`. See the
  `readDraftImageRecords` snippet under FORCING.
- **Quest images directory on disk** — `<repoRoot>/.dungeonmaster-dev/guilds/<guildId>/quests/<questFolder>/images/`
  (only populated once a message with images is actually SENT, not merely pasted) — `ls` it or
  `python3 os.walk`.
- **The chat POST request/response** — `POST /api/quests/<questId>/chat`, body
  `{message, images: [{mediaType, dataBase64}, ...]}`, response `{chatProcessId}`. Inspect with
  `mcp__claude-in-chrome__read_network_requests` after pressing Enter, filtered to that URL.
- **quest.json itself** — `<repoRoot>/.dungeonmaster-dev/guilds/<guildId>/quests/<questFolder>/quest.json`
  (Read tool) — not touched by this flow except as SEEDING writes it up front.

## FORCING

Install this once per fresh page (defines `window.__dm`, all the browser-side mechanics this flow
needs) via `javascript_tool` before pasting anything:

```js
window.__dm = {
  buildImageDataUrl: async ({ widthPx, heightPx, seed, mimeType = 'image/png' }) => {
    const canvas = document.createElement('canvas');
    canvas.width = widthPx; canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    const red = (seed * 37) % 256, green = (seed * 59) % 256, blue = (seed * 83) % 256;
    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    ctx.fillRect(0, 0, widthPx, heightPx);
    const notch = Math.max(2, Math.min(widthPx, heightPx, 4 + seed * 3));
    ctx.fillStyle = `rgb(${blue}, ${red}, ${green})`;
    ctx.fillRect(0, 0, notch, notch);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob null'))), mimeType));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  },
  buildOverCapImageDataUrl: async ({ widthPx, heightPx, noiseBandRows }) => {
    const canvas = document.createElement('canvas');
    canvas.width = widthPx; canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(120, 90, 60)';
    ctx.fillRect(0, 0, widthPx, heightPx);
    const noise = ctx.createImageData(widthPx, noiseBandRows);
    for (let i = 0; i < noise.data.length; i++) noise.data[i] = Math.floor(Math.random() * 256);
    for (let i = 3; i < noise.data.length; i += 4) noise.data[i] = 255;
    ctx.putImageData(noise, 0, 0);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  },
  // Real GIF87a/GIF89a bytes — this Chrome's `canvas.toBlob` has no GIF encoder (it silently falls
  // back to image/png for a mimeType it doesn't support), so a real GIF paste has to be hand-built
  // rather than produced via buildImageDataUrl. A 1x1 image with a 2-colour global colour table, a
  // comment extension carrying `marker` (never rendered — just what keeps two GIFs byte-distinct),
  // a graphic control extension, then one pixel of LZW-compressed image data.
  buildGifBytes: ({ marker }) => {
    const markerBytes = Array.from(marker).map((c) => c.charCodeAt(0));
    return [
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
      0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, // 1x1 logical screen, global colour table present
      0xff, 0xff, 0xff, 0x00, 0x00, 0x00, // colour table: white, black
      0x21, 0xfe, markerBytes.length, ...markerBytes, 0x00, // comment extension: the unique marker
      0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, // graphic control extension
      0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // image descriptor
      0x02, 0x02, 0x44, 0x01, 0x00, // LZW image data, one pixel
      0x3b, // trailer
    ];
  },
  pasteImage: ({ dataUrl, fileName = 'pasted-image.png' }) => {
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    const commaIndex = dataUrl.indexOf(',');
    const mediaType = /^data:(.*);base64$/.exec(dataUrl.slice(0, commaIndex))?.[1] ?? 'application/octet-stream';
    const binary = atob(dataUrl.slice(commaIndex + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], fileName, { type: mediaType });
    const dt = new DataTransfer();
    dt.items.add(file);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    return editor.dispatchEvent(event); // false once preventDefault fires (image accepted or rejected — both preventDefault)
  },
  pasteBytes: ({ bytes, mediaType, fileName = 'pasted-bytes' }) => {
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    const file = new File([new Uint8Array(bytes)], fileName, { type: mediaType });
    const dt = new DataTransfer();
    dt.items.add(file);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    return editor.dispatchEvent(event);
  },
  pasteText: ({ text }) => {
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    return editor.dispatchEvent(event);
  },
  pasteTextAndImage: ({ text, dataUrl, fileName = 'pasted-image.png' }) => {
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    const commaIndex = dataUrl.indexOf(',');
    const mediaType = /^data:(.*);base64$/.exec(dataUrl.slice(0, commaIndex))?.[1] ?? 'application/octet-stream';
    const binary = atob(dataUrl.slice(commaIndex + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], fileName, { type: mediaType });
    const dt = new DataTransfer();
    dt.items.add(file); // file first, matches a real OS clipboard carrying image+alt-text together
    dt.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    return editor.dispatchEvent(event);
  },
  placeCaret: ({ index }) => {
    // index is a CHILD-NODE offset into CHAT_INPUT — 1 sits between children[0] and children[1].
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    editor.focus();
    const range = document.createRange();
    range.setStart(editor, index); range.setEnd(editor, index);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  },
  readChildren: () => {
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    const out = [];
    editor.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) out.push({ kind: 'text', text: node.textContent ?? '' });
      else if (node instanceof HTMLImageElement)
        out.push({ kind: 'image', attachmentId: node.getAttribute('data-attachment-id'), src: node.getAttribute('src') });
    });
    return out;
  },
  readDraftText: () => localStorage.getItem('dungeonmaster-chat-draft'),
  readDraftImageRecords: async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('dungeonmaster-chat-drafts', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(['dungeonmaster-chat-draft-images'], 'readonly');
      const r = tx.objectStore('dungeonmaster-chat-draft-images').getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    db.close();
    return records;
  },
  clearStorage: () => { localStorage.clear(); indexedDB.deleteDatabase('dungeonmaster-chat-drafts'); },
};
'installed';
```

Then drive each path (values built with the helper above are stashed on `window` so later calls can
reuse them, e.g. `window.__img1 = await window.__dm.buildImageDataUrl({widthPx:20,heightPx:20,seed:1})`):

- **"no image"** (P1) — `window.__dm.pasteText({text: 'hello'})` on an empty, focused composer. No
  file item on the `DataTransfer` at all → the plain-text-insert branch, never the image branch.
- **"image"** (P2–P12 root) — `window.__dm.pasteImage({dataUrl})`, any allowed or disallowed mime.
- **"unsupported"** (P2) — `window.__dm.pasteBytes({bytes: [0,1,2,3], mediaType: 'image/bmp'})`. Any
  byte content works — the guard checks `imageItem.type`, never decodes the bytes. `image/bmp` is
  outside `pastedImageStatics.allowedMediaTypes` (`png`, `jpeg`, `gif`, `webp`).
- **"supported"** — PNG and JPEG: `buildImageDataUrl({..., mimeType: 'image/png'})` /
  `{..., mimeType: 'image/jpeg'}` and paste it — both actually produce that format. WebP:
  `buildImageDataUrl({..., mimeType: 'image/webp'})` also genuinely works in this Chrome, but VERIFY
  it before relying on it — check the returned data URL starts with `data:image/webp`, not
  `data:image/png`. **GIF does NOT work through `buildImageDataUrl`** — `canvas.toBlob` silently
  falls back to `image/png` for a mimeType it doesn't support, so both the returned data URL and the
  `File` type `pasteImage`'s regex derives from it read `image/png`; a walker following the naive
  "just pass `mimeType: 'image/gif'`" recipe tests PNG twice and never reaches the GIF branch at all.
  Build real GIF87a/GIF89a bytes instead and paste them through `pasteBytes` with the `File` type set
  explicitly: `window.__dm.pasteBytes({bytes: window.__dm.buildGifBytes({marker: 'WALKER-GIF-1'}),
  mediaType: 'image/gif', fileName: 'walker-1.gif'})` (`buildGifBytes` is in the library above). Give
  each GIF pasted in the same walk a distinct `marker` so they stay byte-distinct.
- **"already 5"** (P3) — paste 5 allowed images sequentially FIRST (each seed different so
  `check-limit-count-unchanged` has real srcs to compare), waiting for the thumbnail count to reach N
  before the next paste (the limit check reads the live DOM count, so racing two pastes can under- or
  over-count) — `pastedImageStatics.maxImagesPerMessage` is 5. The 6th paste is refused.
- **"room left"** — paste 4 (not 5) first, so the 5th still lands.
- **"over 5 MB"** (P4, P5) — `window.__dm.buildOverCapImageDataUrl({widthPx: 6000, heightPx: 4000, noiseBandRows: 700})`.
  A flat-colour canvas compresses to near-nothing regardless of dimensions — only a noised band forces
  the PNG past `pastedImageStatics.maxBytesPerImage` (5,242,880 bytes). Verify before pasting:
  `(dataUrl.length - dataUrl.indexOf(',') - 1)` run through base64-byte-length math, or just trust the
  6000×4000 + 700-row-noise recipe (it's what the real e2e spec uses and measures >5 MB every run).
- **"at or under 5 MB"** (P9–P12) — a small canvas, any allowed mime, e.g.
  `buildImageDataUrl({widthPx: 40, heightPx: 30, seed: 1, mimeType: 'image/jpeg'})`. Use a **JPEG**
  source specifically when the check must prove the downscale ladder never ran (`check-*` on
  untouched bytes): the ladder's first re-encode attempt always emits PNG, so a surviving
  `image/jpeg` data URL byte-for-byte equal to the source is proof the ladder was skipped — a PNG
  source can't distinguish "skipped" from "ran and produced identical bytes."
- **"conversion failed or still over"** (P4) — corrupt input that is ALSO already over the byte cap,
  so it forces the over-cap branch before failing decode:
  `window.__dm.pasteBytes({bytes: [...pngSignatureAndIhdr, ...new Array(5300000).fill(0)], mediaType: 'image/png', fileName: 'over-cap-corrupt.png'})`
  where `pngSignatureAndIhdr` is exactly
  `[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,0x00,0x00,0x17,0x70,0x00,0x00,0x0f,0xa0,0x08,0x06,0x00,0x00,0x00,0x00,0x00,0x00,0x00]`
  (a real PNG signature + IHDR declaring a large image, 33 bytes) followed by 5,300,000 zero bytes
  that form no valid chunk — total 5,300,033 bytes, over the 5,242,880 cap, and undecodable. (A
  *small* truncated PNG — just the 16-byte signature+partial-IHDR with no filler — proves only the
  plain corrupt-format toast, never this over-cap edge; see `check-corrupt-image-same-toast` vs. this
  one.)
- **"now under"** (P5, P6, P7, P8) — the same 6000×4000-over-cap image as above; the ladder succeeds
  (caps the longest edge at `maxLongestEdgePx` = 2000, and 2000px is small enough to land under 5 MB
  on the first attempt for this fixture).
- **"backspace or delete"** (P6, P10) — place the caret directly after (index = position right after
  the `<img>`'s child slot) or directly before a thumbnail via `window.__dm.placeCaret({index})`, then
  send a real `Backspace`/`Delete` keystroke through the OS-level input, not a synthetic KeyboardEvent
  — `beforeinput`'s `inputType` (`deleteContentBackward`/`deleteContentForward`) is what the composer
  intercepts, and only a real keypress reliably produces it in Chromium. Use
  `mcp__claude-in-chrome__computer` (or the harness's own `page.keyboard.press('Backspace')`
  equivalent) after `placeCaret`, never `dt.deleteContents()` by hand. **Before that key press, make
  sure the tab is actually foregrounded — see the backgrounded-tab trap in TRAPS**: a hidden tab
  silently swallows the keystroke instead of erroring.
- **"page reload"** (P7, P11) — after the draft is written (paste lands, `handleContentChanged`
  fires), `navigate` to the SAME URL again (or use the browser's reload) — do NOT re-run the storage
  clear before this reload, or the very draft you're proving survives gets wiped first.
- **"sends the restored draft"** (P7, P11) — after the reload's restore completes (thumbnail count
  back to what it was), click `CHAT_INPUT` to focus it, then press `Enter` (a real keystroke, not
  `pasteText` — Enter with no Shift calls `handleSend`). Watch
  `mcp__claude-in-chrome__read_network_requests` for `POST /api/quests/<questId>/chat`. That click is
  not optional stylistic focus — see the backgrounded-tab trap in TRAPS: if the tab is still hidden, a
  bare key press for Enter will no-op and nothing will POST.
- **"clicks image"** (P8, P12) — click the `CHAT_INPUT_THUMBNAIL` element directly (not via
  `dispatchEvent` — a real click so React's `onClick`/`handleEditorClick` sees a `target instanceof
  HTMLImageElement`).

## TRAPS

- **The Vite dev-server watcher restarts the API on ANY file save anywhere in `packages/*/src/**`,
  for ~1.5s**, during which `/api` answers a bare 500 with an empty body. If a paste/reload/send
  action inexplicably fails right after some other tool call touched a source file, that's why — wait
  a couple seconds and retry rather than assuming the flow itself is broken. (`npm run dev` uses
  `tsx watch --conditions=source`; see this repo's root CLAUDE.md.)
- **Every insert/delete/click is the tail of an async handler** — `handlePaste` does a `FileReader`
  read then an `await pastedImageAttachBroker(...)` (which itself may run the downscale ladder)
  before the thumbnail lands. A one-shot DOM read right after `dispatchEvent` returns will race ahead
  of it. Poll `CHAT_INPUT_THUMBNAIL`'s count (or the toast text) until it changes rather than reading
  once.
- **`placeCaret`'s `index` is a CHILD-NODE offset, not a character offset.** For `text, <img>, text`
  (3 children), index `1` sits between child 0 and child 1 (right before the image); index `2` sits
  right after it. Off-by-one here silently sends Backspace/Delete after the wrong node and the "one
  keystroke removes the whole thumbnail" check reads as a false failure.
- **A same-dimension PNG re-encodes byte-identically** whether or not the downscale ladder ran on it
  — Chromium's PNG encoder is deterministic. Any check that must prove the ladder was SKIPPED (the
  "at or under 5 MB" branch, or that two identical pastes produce byte-identical thumbnails) needs a
  **JPEG** source, not PNG — see "at or under 5 MB" under FORCING.
- **`pastedImageAttachBroker` mints a fresh `attachmentId` on every call, even for byte-identical
  input.** Pasting the same clipboard item twice is meant to produce two distinct thumbnails with two
  distinct ids and identical bytes — that is the documented behavior (`check-same-clipboard-twice-*`),
  not a bug to route around.
- **`beforeinput`'s delete interception only fires for a REAL keypress**, not a synthetic
  `KeyboardEvent('keydown')` dispatched via `dispatchEvent` — Chromium does not synthesize
  `beforeinput` from a fake `keydown`. Use the browser automation tool's real key-press action.
- **`handleSend` no-ops on an empty trimmed message** — but a composer holding only a pasted image
  still serializes to `[Pasted Image 1]` as its text, so Enter with an image and zero typed characters
  still sends. Don't mistake a stuck SEND_BUTTON disabled state for this — check `isSending` (locked
  only while a POST from THIS composer is in flight) instead.
- **Draft-store clearing via `page.addInitScript`-equivalent re-arms on every navigation**, including
  a reload you want to observe. If you install a storage-clear that runs on every page load, do the
  ONE-SHOT version (`window.__dm.clearStorage()` called directly, once) instead before a reload test —
  never re-register it to fire again on the reload itself. Even then, don't trust it on sight:
  `clearStorage()` empties the STORES but not whatever the live DOM already restored before you ran
  it — reload, then confirm `readChildren().length === 0` / `readDraftText() === null`, exactly as in
  RESET.
- **Guild `path` must already exist as a directory before `POST /api/guilds`** — `mkdir -p` it first;
  the harness's own setup always does this before the API call.
- **The MCP browser tab can start BACKGROUNDED** — `document.visibilityState === "hidden"` even
  immediately after `tabs_context_mcp` / `navigate`. Taking a screenshot alone does NOT flip it to
  "visible". While hidden, `mcp__claude-in-chrome__computer` `type` and key presses SILENTLY NO-OP
  against the composer — no error, the keystroke just never lands. This is the trap under "backspace
  or delete" and "sends the restored draft" in FORCING — a walker hit it for real and lost several
  minutes to silently-no-op keystrokes before finding the fix.
- **Getting focus into CHAT_INPUT is unreliable in BOTH directions, and the failure is always
  silent.** Across three walkers in the same session, no single method won: a real
  `computer.left_click` was what got typing working for one walker; for another, `left_click` at the
  CHAT_INPUT rect's exact centre — verified with `document.elementFromPoint` hitting the right element
  — left `document.activeElement` as `BODY` every time, on both CHAT_INPUT and SEND_BUTTON, while JS
  `.focus()` plus a Selection/Range moved focus reliably instead; a third walker's clicks missed
  entirely because the screenshot's pixel space (1456x813) did not match `window.innerWidth`/
  `innerHeight` (2365x1321) — see the coordinate-space trap below. Do not trust either method as THE
  fix. The only reliable procedure: attempt one method (click OR `focus()`+Selection/Range), then READ
  `document.activeElement.getAttribute('data-testid')` and require it to equal `CHAT_INPUT`. If it
  does not, try the OTHER method and read it again. Only then send a keystroke, and read the DOM back
  afterwards to confirm the character landed — keystrokes themselves are probabilistic too, independent
  of focus (one walker had a `computer.key Return` silently no-op with zero network requests and no
  error, then succeed on an identical retry).
- **`mcp__claude-in-chrome__find` (accessibility-tree search) has reported "no contenteditable input
  area" and "no send button" on this page while both elements existed, were interactable, and were
  confirmed by `querySelector` on their testids.** Do not conclude CHAT_INPUT or SEND_BUTTON is
  missing because `find` cannot see it — use `document.querySelector('[data-testid="..."]')` to locate
  elements and `getBoundingClientRect()` for click coordinates instead.
- **`javascript_tool`'s return-value scanner BLOCKS any result containing a
  `data:image/png;base64,...` string** (`[BLOCKED: Cookie/query string data]`). The script still RUNS
  and its side effects still happen — only the returned value is withheld, which can read as "the
  paste/read silently failed" when it didn't. Never return raw data URLs or full `innerHTML` from a
  script. Return a rolling hash plus a length instead, and do byte-for-byte comparisons INSIDE the
  page (`afterHTML === beforeHTML`) returning only the boolean.
- **Real keystrokes fragment text into one DOM text node PER CHARACTER.** Typing `'before'` through
  `computer.type` leaves six sibling text nodes — `'b'`,`'e'`,`'f'`,`'o'`,`'r'`,`'e'` — not one merged
  node. Text inserted through a synthetic clipboard paste (`window.__dm.pasteText`) lands as a SINGLE
  node instead. This is native Chrome contenteditable behaviour; the app does not coalesce it.
  Consequence for a walker: any check phrased as "the text node reads `'a '`" or "child order is text
  `'ab'`, thumbnail, text `'cd'`" must be measured by CONCATENATING adjacent text nodes and comparing
  the resulting string, or by reading `textContent` across the run — never by asserting a single node
  exists. A walker that counts nodes on typed content will report a false failure; content and order
  are still correct, only the node structure is fragmented. Say which method produced the text (typed
  vs pasted) when reporting such a check.
- **The hidden-tab keystroke trap above is PROBABILISTIC, not deterministic.** One walker saw
  `document.visibilityState` read `"hidden"` for an entire walk even after real clicks and
  screenshots, yet nearly every keystroke still landed — exactly one silently no-opped. So a real
  `left_click` before typing is good practice but does not reliably flip the tab to "visible." Verify
  each keystroke actually landed by reading the DOM back, and retry a dropped one rather than assuming
  the app ate it.
- **Screenshot pixel space does not match the page's own coordinate space.** One walker's tab
  screenshotted at 1456x813 while `window.innerWidth`/`innerHeight` read 2365x1321 — a ratio of about
  1.625. A `computer.left_click` aimed at screenshot coordinates that LOOK correct can land somewhere
  else entirely: two clicks in a row failed to move focus onto CHAT_INPUT (`document.activeElement`
  stayed `BODY`), and the `type('a')` that followed was silently dropped. Checking
  `document.visibilityState` does NOT catch this — the tab was fine; the click missed. The check that
  does catch it: after every click, read `document.activeElement.getAttribute('data-testid')` and
  confirm it equals `CHAT_INPUT` before sending any keystroke — re-click until it does. Read
  `window.innerWidth`/`innerHeight` once at the start and scale click coordinates by the ratio against
  the screenshot's dimensions. Then read the DOM back after every keystroke to confirm the character
  landed, and retry a dropped one. When a unit says "a SINGLE Backspace removes the thumbnail," a
  retried keystroke that never reached the page is not a second press — say explicitly which of the
  two happened.
