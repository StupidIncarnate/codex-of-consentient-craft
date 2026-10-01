# DEF-280: `create-package --dry-run` prints file names, never what it would write in them

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a consumer cannot compare its configs with what `create-package` writes without a throwaway run |
| Package | cli |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 10, 2026-10-01 |

## What is wrong

`dungeonmaster create-package --dry-run` prints one line per file name (`cli-create-package-responder.ts:95-98`), then
"Would write N files. Nothing was written." (`:100-102`). It never prints a file's contents.

The scaffold transformer's header says the plan exists so "`--dry-run` print[s] exactly what a real run would write"
(`package-scaffold-files-transformer.ts:4`). Assayer needed exactly that: its item P0-5 checks each package's
`tsconfig` and Jest config against what `create-package` writes for that package type. With names only, the
comparison needs a real run in a scratch folder.

## What should happen

`--dry-run` prints each planned file's path followed by its full contents, in the order a real run writes them. A
flag that keeps the names-only listing is fine if a short form is still wanted. A test asserts the printed contents of
one planned file match what a real run writes to disk.

## Where to look

- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts:95-103`
- `packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.ts:1-12`
- `packages/cli/src/contracts/scaffold-file/scaffold-file-contract.ts` (each planned file already carries its contents)

## History

Assayer upstream report 10.
