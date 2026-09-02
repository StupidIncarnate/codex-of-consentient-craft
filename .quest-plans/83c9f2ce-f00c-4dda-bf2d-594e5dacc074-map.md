# server × render-images-in-transcript

Cell: package `server`, flow `render-images-in-transcript`.
Two halves: (A) the `/api/images` serve route, brand new; (B) three replay-relay observables on the
already-built WS path, which need tests they do not have.

GROUP 1  (all touch different files — one wave)
  packages/server/src/statics/api-routes/api-routes-statics.ts        edit — add `images: { serve: pastedImageStatics.serveRoutePath, pathQueryParam: 'path' }`, READ from '@dungeonmaster/shared/statics', never retyped
  packages/server/src/statics/api-routes/api-routes-statics.test.ts   edit — extend the toStrictEqual shape; add a test pinning serve === pastedImageStatics.serveRoutePath
  packages/server/src/transformers/image-content-type/image-content-type-transformer.ts  new — extension → image/png|jpeg|gif|webp, null otherwise; mirror web-bundle-content-type-transformer
  packages/server/src/transformers/image-content-type/image-content-type-transformer.test.ts  new — incl. a test pinning the map's keys to pastedImageStatics.allowedExtensions
  packages/server/src/statics/image-serve/image-serve-statics.ts      new — { maxPathLength: 4096 }
  packages/server/src/statics/image-serve/image-serve-statics.test.ts new
  packages/server/src/guards/is-servable-image-path/is-servable-image-path-guard.ts   new — absolute (absoluteFilePathContract.safeParse), no '..' SEGMENT, no \0, no \n or \r, length <= maxPathLength
  packages/server/src/guards/is-servable-image-path/is-servable-image-path-guard.test.ts new
  packages/server/src/adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.ts        new — readFile(path) with NO encoding → Uint8Array
  packages/server/src/adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.proxy.ts  new
  packages/server/src/adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.test.ts   new
  packages/server/src/responders/server/init/server-init-responder.test.ts             edit — 3 new tests for the replay half (B)
  packages/server/test/harnesses/server-app/server-app.harness.ts                      edit — add seedImageFile({ baseName, fileName, bytes }) → { imagePath, cleanup }

GROUP 2  (needs group 1)
  packages/server/src/brokers/image/serve/image-serve-broker.ts        new — guard → content-type → read; null on every refusal
  packages/server/src/brokers/image/serve/image-serve-broker.proxy.ts  new
  packages/server/src/brokers/image/serve/image-serve-broker.test.ts   new

GROUP 3  (needs group 2)
  packages/server/src/responders/image/serve/image-serve-responder.ts        new — undefined/empty param → 404; try/catch so it never throws
  packages/server/src/responders/image/serve/image-serve-responder.proxy.ts  new
  packages/server/src/responders/image/serve/image-serve-responder.test.ts   new

GROUP 4  (needs group 3)
  packages/server/src/flows/images/images-flow.ts                     new — app.get(apiRoutesStatics.images.serve, ...)
  packages/server/src/flows/images/images-flow.integration.test.ts    new — REAL temp file via the harness; the byte/content-type/404 proofs
  packages/server/src/startup/start-server.ts                         edit — ImagesFlow() into subApps, BEFORE ServerInitResponder's catch-all runs

PROVES
  #check-route-answers            -> images-flow.integration.test.ts (route answers with the file while a catch-all sits behind it)
  #check-traversal-segments-404   -> images-flow.integration.test.ts (malformed table)
  #check-null-byte-404            -> images-flow.integration.test.ts (malformed table)
  #check-newline-in-path-404      -> images-flow.integration.test.ts (malformed table)
  #check-relative-path-404        -> images-flow.integration.test.ts (malformed table)
  #check-missing-param-404        -> images-flow.integration.test.ts (malformed table)
  #check-empty-param-404          -> images-flow.integration.test.ts (malformed table)
  #check-overlong-path-404        -> images-flow.integration.test.ts (malformed table)
  #check-handler-never-throws     -> images-flow.integration.test.ts (every malformed case answers 404, never 500)
  #check-missing-file-404         -> images-flow.integration.test.ts (real temp dir, no such file)
  #check-non-image-extension-404  -> images-flow.integration.test.ts (path=/etc/passwd, zero bytes back)
  #check-never-403                -> images-flow.integration.test.ts (every case's status asserted exactly)
  #check-bytes-match-disk         -> images-flow.integration.test.ts (REAL file written by the harness, byte-for-byte compare)
  #check-png-content-type         -> images-flow.integration.test.ts
  #check-webp-content-type        -> images-flow.integration.test.ts
  edge "readable image"                        -> images-flow.integration.test.ts (200 + bytes)
  edge "missing, unreadable or not an image"   -> images-flow.integration.test.ts (404 + zero bytes)
  terminal #image-not-served                   -> images-flow.integration.test.ts
  #check-server-relays-replay     -> server-init-responder.test.ts (getReplayChatHistoryCalls, exactly one, that sessionId)
  #check-entry-emitted-as-replay  -> server-init-responder.test.ts (relayed frame keeps replay:true and the entry)
  #check-ws-frame-reaches-client  -> server-init-responder.test.ts (subscribed client's send receives the frame)

TRAPS
  - api-routes-statics.test.ts asserts the WHOLE object with toStrictEqual — a new key breaks it unless the test is updated in the same edit.
  - exactOptionalPropertyTypes: declare `{ path: string | undefined }`, never `{ path?: string }` — the flow passes c.req.query(...) which can be undefined.
  - fs-read-file-bytes-adapter.proxy mocks the SAME npm `readFile` as fs-read-file-adapter.proxy, both keyed on the path alone. Different paths never collide; two proxies staging ONE path would. Say so in a comment, as fs-write-file-base64-adapter.proxy.ts already does for writeFile.
  - Hono's catch-all in ServerInitResponder 404s anything under /api/, so a route that is not mounted looks exactly like a route that refused. The mount proof needs a 200 with bytes, not a 404.
  - ban-silent-catch: the read's catch must log through processDevLogAdapter, not swallow.
  - No magic numbers: 4096 goes in image-serve-statics, not inline.
  - git: never `git -C`, never chain a git call with && or pipe it — both come back refused. Call git bare, one call per invocation, trimmed with git's own flags.
