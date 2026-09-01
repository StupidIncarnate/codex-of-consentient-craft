# shared · send-message-with-images

Package: shared. Flow: #send-message-with-images.
One node is mine: #resolve-images-dir. One observable: #check-images-dir-name-is-shared.
Three contracts are mine to build, one is existing-and-unchanged.

GROUP 1  (different files — go out together)
  packages/shared/src/statics/pasted-image/pasted-image-statics.ts        new   — the 11 knobs from #pasted-image-statics, plain `as const`, mirror quest-summary-limits-statics
  packages/shared/src/statics/pasted-image/pasted-image-statics.test.ts   new   — one toStrictEqual over the whole object
  packages/shared/statics.ts                                             edit  — barrel line for pasted-image-statics
  ---
  packages/shared/src/statics/locations/locations-statics.ts             edit  — `imagesDir: 'images'` in the `quest` group beside questFile/wardResultsDir/riftcarverResultsDir/designDir
  packages/shared/src/statics/locations/locations-statics.test.ts        edit  — same key in the expected toStrictEqual shape

GROUP 2  (needs group 1 — the enum reads pastedImageStatics.allowedMediaTypes)
  packages/shared/src/contracts/pasted-image-media-type/pasted-image-media-type-contract.ts       new
  packages/shared/src/contracts/pasted-image-media-type/pasted-image-media-type.stub.ts           new
  packages/shared/src/contracts/pasted-image-media-type/pasted-image-media-type-contract.test.ts  new

GROUP 3  (needs group 2 — the upload contract imports the media-type contract)
  packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts       new
  packages/shared/src/contracts/pasted-image-upload/pasted-image-upload.stub.ts           new
  packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.test.ts  new
  packages/shared/contracts.ts                                                            edit  — 4 barrel lines (both contracts + both stubs)

NO CHANGE
  packages/shared/src/contracts/chat-entry/chat-entry-contract.ts — #user-entry is "Unchanged" on every
  property. Verified present as spec'd: role z.literal('user'), content branded UserContent,
  uuid ChatEntryUuid, timestamp IsoTimestamp. No images field is added.

PROVES
  #check-images-dir-name-is-shared  -> packages/shared/src/statics/locations/locations-statics.test.ts

TRAPS
  - `images` is 6 chars with no dot or slash, so `shouldRetainLocationLiteralGuard`
    (minRetainedLiteralLength 8) drops it from the no-bare-location-literals banned set.
    Adding the key bans nothing repo-wide. Do NOT add it to `excludedLiterals`.
  - Statics in this repo are plain `as const` with raw literals — never branded, never zod.
    The type names in the spec (PastedImageCount, ByteLength, TokenPattern…) are labels for what
    the value means, not brands to apply. Branding allowedMediaTypes would break z.enum over it.
  - The two patterns are STRINGS, not RegExp literals — statics must stay serialisable, and the
    server / browser / orchestrator each build their own RegExp with their own flags.
  - zod is ^3.22.4 — `z.string().base64()` landed in 3.23. Use a regex.
  - contracts/ may import statics/ but nothing else beyond contracts, errors and zod.
  - Stubs import StubArgument from '@dungeonmaster/shared/@types' (self-referential subpath),
    the way rate-limit-window.stub.ts does.

SEAM ASSUMPTIONS (server's half of #resolve-images-dir, not built yet)
  The server resolves <questFolder>/images itself, either through a new
  `brokers/locations/quest-images-path-find/` resolver in shared mirroring
  locations-ward-results-path-find-broker, or by joining questFolderPath with
  locationsStatics.quest.imagesDir. Only 1 of that node's 6 observables is shared's, and it is the
  statics key — so I ship the key and leave the resolver to the server cell.
