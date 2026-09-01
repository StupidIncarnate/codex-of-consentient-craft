# server × send-message-with-images

Operation item: c47eeba9-87ce-42e7-822e-ef7ef9ccfe08

Chain the server owns: POST body carrying `images` -> resolve `<questFolder>/images` -> write one file per
attachment in paste order -> rewrite the Nth `[Pasted Image N]` placeholder as
`![Pasted Image N](<absolute path>)` -> hand the rewritten message to the orchestrator.

GROUP 1  (disjoint files — go out together)
  packages/shared/src/brokers/locations/quest-images-path-find/locations-quest-images-path-find-broker.ts   new  — mirror ward-results-path-find; `{questFolderPath}` -> `<questFolderPath>/images` via locationsStatics.quest.imagesDir
  packages/shared/src/brokers/locations/quest-images-path-find/locations-quest-images-path-find-broker.proxy.ts  new  — mirror ward-results proxy (wraps pathJoinAdapterProxy)
  packages/shared/src/brokers/locations/quest-images-path-find/locations-quest-images-path-find-broker.test.ts   new
  packages/shared/brokers.ts                                                                     edit — one `export *` line beside ward-results-path-find
  packages/server/src/adapters/fs/mkdir/fs-mkdir-adapter.ts                                      new  — `mkdir(dirPath, {recursive: true})`; mirror fs-write-file-adapter shape
  packages/server/src/adapters/fs/mkdir/fs-mkdir-adapter.proxy.ts                                new
  packages/server/src/adapters/fs/mkdir/fs-mkdir-adapter.test.ts                                 new
  packages/server/src/adapters/fs/write-file-base64/fs-write-file-base64-adapter.ts              new  — `writeFile(filePath, dataBase64, 'base64')`; decode-on-write, distinct from the utf8 sibling
  packages/server/src/adapters/fs/write-file-base64/fs-write-file-base64-adapter.proxy.ts        new
  packages/server/src/adapters/fs/write-file-base64/fs-write-file-base64-adapter.test.ts         new
  packages/server/src/contracts/user-message/user-message-contract.ts                            new  — `z.string().min(1).brand<'UserMessage'>()`; one home for a brand three body contracts declare inline today
  packages/server/src/contracts/user-message/user-message.stub.ts                                new
  packages/server/src/contracts/user-message/user-message-contract.test.ts                       new
  packages/server/src/contracts/pasted-image-upload-list/pasted-image-upload-list-contract.ts    new  — `z.array(pastedImageUploadContract).max(pastedImageStatics.maxImagesPerMessage)`; the `.max` IS the 6-image rejection
  packages/server/src/contracts/pasted-image-upload-list/pasted-image-upload-list.stub.ts        new
  packages/server/src/contracts/pasted-image-upload-list/pasted-image-upload-list-contract.test.ts  new
GROUP 2  (needs group 1's two new contracts)
  packages/server/src/transformers/pasted-image-token-substitute/pasted-image-token-substitute-transformer.ts   new  — `{message, imagePaths}` -> Nth placeholder becomes `![Pasted Image N](imagePaths[N-1])`; pattern READ from pastedImageStatics.placeholderPattern
  packages/server/src/transformers/pasted-image-token-substitute/pasted-image-token-substitute-transformer.test.ts  new
  packages/server/src/contracts/message-body/message-body-contract.ts                           edit — `message: userMessageContract`, `images: pastedImageUploadListContract.optional()`
  packages/server/src/contracts/message-body/message-body-contract.test.ts                      edit — images cases
  packages/server/src/contracts/guild-message-body/guild-message-body-contract.ts               edit — same two fields
  packages/server/src/contracts/guild-message-body/guild-message-body-contract.test.ts          edit
  packages/server/src/contracts/quest-new-body/quest-new-body-contract.ts                       edit — same two fields, questType untouched
  packages/server/src/contracts/quest-new-body/quest-new-body-contract.test.ts                  edit

GROUP 3  (needs group 2)
  packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.ts               new  — `{guildId, questId, message, images}` -> mkdir images dir, mint an id per attachment, write each, substitute tokens, return rewritten UserMessage
  packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.proxy.ts         new  — composes fs proxies + registerMock on crypto.randomUUID + os.homedir
  packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.test.ts          new

GROUP 4  (needs group 3)
  packages/server/src/responders/quest/chat/quest-chat-responder.ts                             edit — when images present, call the persist broker before startChat, forward the rewritten message
  packages/server/src/responders/quest/chat/quest-chat-responder.proxy.ts                       edit — compose the persist-broker proxy
  packages/server/src/responders/quest/chat/quest-chat-responder.test.ts                        edit
  packages/server/src/responders/quest/followup/quest-followup-responder.ts                     edit — same wiring
  packages/server/src/responders/quest/followup/quest-followup-responder.proxy.ts               edit
  packages/server/src/responders/quest/followup/quest-followup-responder.test.ts                edit
  packages/server/src/responders/design/session/design-session-responder.ts                     edit — same wiring; guildId comes off the body, questId off params
  packages/server/src/responders/design/session/design-session-responder.proxy.ts               edit
  packages/server/src/responders/design/session/design-session-responder.test.ts                edit

PROVES
  #check-responder-reads-both-images        -> quest-chat-responder.test.ts
  #check-sixth-image-rejected               -> quest-chat-responder.test.ts (+ the list contract's own max test)
  #check-images-dir-created                 -> pasted-image-persist-broker.test.ts
  #check-images-dir-not-recreated           -> pasted-image-persist-broker.test.ts (recursive mkdir, no unlink, second send's paths differ)
  #check-identical-images-get-distinct-names-> pasted-image-persist-broker.test.ts
  #check-both-copies-readable-after         -> pasted-image-persist-broker.test.ts
  #check-first-message-tokens-still-resolve -> pasted-image-persist-broker.test.ts
  #check-file-bytes-match-post              -> pasted-image-persist-broker.test.ts
  #check-two-files-written-in-order         -> pasted-image-persist-broker.test.ts
  #check-token-becomes-markdown-path        -> pasted-image-token-substitute-transformer.test.ts
  #check-nth-token-maps-to-nth-file         -> pasted-image-token-substitute-transformer.test.ts + broker test
  #check-placeholder-pattern-from-shared    -> read-check; my reviewer opens the transformer
  #check-forwarded-once                     -> quest-chat-responder.test.ts
  edge "rejected"  off #server-accepted     -> responder tests: a rejected body answers 400 and no file is written
  edge "accepted"  off #server-accepted     -> responder tests: an accepted body answers 200 with chatProcessId

  Not provable here: nothing on this list needs a browser. The create route is a SCOPE HOLE, below.

SCOPE HOLE — the quest-create route
  `questNewBodyContract` gains `images` (a contract this item owns), but `QuestNewResponder` cannot
  write them. `StartOrchestrator.startChat` mints the quest itself, inside the same call that spawns the
  CLI (`resolveChatQuestLayerBroker` -> `questUserAddBroker`, with the message as the quest's
  userRequest), so on that route no questId and no quest folder exist until after the message has
  already reached the agent. Writing the files and rewriting the tokens between the mint and the launch
  is orchestrator work, and the orchestrator's cell on this flow shipped without it. Record as a spec
  change; do not fake it server-side.

TRAPS
  - Ward: `npm run ward -- --only lint,test -- <your own paths>`. No `npm run build`, no typecheck, no run-ward MCP tool, no commit.
  - git: never `git -C <path> …`, never chain a git call with `&&`, never pipe git output. One bare git call per invocation, trimmed with git's own flags.
  - `exactOptionalPropertyTypes` is on: OMIT an optional property, never pass `undefined`. Spread it: `...(images === undefined ? {} : { images })`.
  - No `toEqual` / `toMatchObject` / `toContain` / `toBeDefined` / `toHaveLength` / `.not.*`. `toStrictEqual` for objects and arrays.
  - No `beforeEach` / `afterEach`, no conditionals in a test body.
  - Mock only at the npm boundary, in a `.proxy.ts`, via `registerMock`. Never `jest.mock` / `jest.spyOn` / `jest.mocked`. Never mock app code.
  - Branded types: parse through the target contract to re-brand. Never `as unknown as`.
  - Every impl file needs the PURPOSE/USAGE header, and PURPOSE is written LAST — why the file exists and when to pick it over its nearest sibling, never its return shape or what its zod chain validates.
  - Read `pastedImageStatics` from `@dungeonmaster/shared/statics`. Never inline `[Pasted Image N]`, the media types, the extensions or the count cap.
