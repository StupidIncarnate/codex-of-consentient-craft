/**
 * PURPOSE: The one document an agent reads before it touches this repo — where a file goes, and how
 * to write it once it is there. Most of the text is literal markdown rather than assembled from
 * statics, so the output is readable in this file without rendering it.
 *
 * USAGE:
 * const markdown = architectureOverviewBroker();
 * // Returns ContentText answering the get-architecture MCP tool
 */
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import {
  folderConfigContract,
  type FolderConfig,
} from '../../../contracts/folder-config/folder-config-contract';
import { folderDependencyTreeTransformer } from '../../../transformers/folder-dependency-tree/folder-dependency-tree-transformer';
import { isKeyOfGuard } from '../../../guards/is-key-of/is-key-of-guard';

export const architectureOverviewBroker = (): string => {
  const { hierarchy } = folderDependencyTreeTransformer({
    folderConfigs: folderConfigStatics,
  });

  // Build folder types table using entries sorted by depth
  type FolderKey = keyof typeof folderConfigStatics;
  const unsortedEntries: { key: FolderKey; config: FolderConfig }[] = [];

  for (const key in folderConfigStatics) {
    if (Object.hasOwn(folderConfigStatics, key) && isKeyOfGuard(key, folderConfigStatics)) {
      unsortedEntries.push({
        key,
        config: folderConfigContract.parse(folderConfigStatics[key]),
      });
    }
  }

  const folderEntries = unsortedEntries.sort((a, b) => {
    const depthDiff = a.config.folderDepth - b.config.folderDepth;
    if (depthDiff !== 0) {
      return depthDiff;
    }
    return a.key.localeCompare(b.key);
  });

  // Build architecture layer diagram (using hierarchy from transformer)
  const layerDiagram = `\`\`\`
${hierarchy}
\`\`\``;

  // Build allowed layer folders list from config
  const allowsLayerFolders = folderEntries
    .filter(({ config }) => config.allowsLayerFiles)
    .map(({ key }) => `\`${key}/\``)
    .join(', ');

  // Combine all sections
  const markdown = `# Architecture Overview

## Critical Context: Why This Architecture

LLMs instinctively "squirrel away" code based on training data patterns, which produces \`utils/\`, \`lib/\`, \`helpers/\`. The folder names here are deliberately unconventional — brokers, transformers, guards — so no training pattern fires and every file has exactly one correct home. ESLint enforces the rest.

## Architecture Layer Diagram

${layerDiagram}

## Forbidden Folders - Where Code Actually Goes

| ❌ FORBIDDEN | ✅ USE INSTEAD | WHY |
|-------------|----------------|-----|
| models/, types/, interfaces/, validators/ | contracts/ | Every type and every schema is a contract |
| constants/, config/, enums/ | statics/ | Every immutable value is a static |
| formatters/, mappers/, converters/ | transformers/ | Every A-to-B data change is a transformer |
| core/, services/, repositories/ | brokers/ | Every business operation is a broker |
| lib/ | brokers/, or \`#gateway\` for an outside package | An outside package is reached only through the gateway: \`#gateway/<folder>/<subpath>\` |
| utils/, helpers/ | guards/ or transformers/ | Split by what it does: returns a boolean, or reshapes data |
| common/, shared/ | Distribute by function | A catch-all folder has no rule to enforce |

\`@types/\` is the one exception, allowed at package root only:

\`\`\`
package-root/
├── @types/
│   └── error-cause.d.ts     # ONLY for augmenting built-ins: Error, Window, globalThis
├── src/
│   └── contracts/           # Every application type lives here instead
└── package.json
\`\`\`

## Import Rules

Only **entry files** cross a domain folder boundary. An entry file's name is its folder path plus the folder suffix and nothing else — \`[folder-path]-[folder-suffix].ts\`.

- \`brokers/user/fetch/user-fetch-broker.ts\` ✅ name is the folder path
- \`brokers/quest/load/quest-load-broker.ts\` ✅ name is the folder path
- \`contracts/user/user-contract.ts\` ✅ name is the folder path
- \`brokers/user/fetch/validate-helper.ts\` ❌ extra word "validate"
- \`brokers/user/fetch/validate-layer-broker.ts\` ❌ extra words "validate-layer"
- \`widgets/user-card/avatar-layer-widget.tsx\` ❌ extra words "avatar-layer"

Inside one domain folder every file may import every other, helpers and layers included. Across folders, only the ✅ rows are reachable at all.

## Outside Packages: the Gateway

An outside package is reached only through the gateway: \`#gateway/<folder>/<subpath>\`, where \`<folder>\` is \`npm\`, \`node\`, \`browser\` or \`bin\`. Every folder type imports outside things through it, types included, and nothing imports a raw package.

A wrapper is one folder per subpath under \`packages/@gateway/<folder>/src/<subpath>/\`, holding the wrapper file plus its \`.proxy.ts\` and \`.stub.ts\`. A consumer repo's \`npm\` and \`bin\` wrappers start empty; the \`consumerGatewayWrapper\` session snippet says how to add the first one.

## Cross-Package Public API

Packages expose their public surface through **folder-type barrel files** — one \`.ts\` file per folder type, named for it and sitting inside the folder it covers (\`src/contracts/contracts.ts\`, \`src/brokers/brokers.ts\`, \`src/guards/guards.ts\`, …). Each barrel line re-exports one entry file (an \`export *\` of, e.g., \`./user/user-contract\`).

- A barrel holds production exports only, and nothing else. No package has a root-level barrel and no \`testing.ts\`.
- \`package.json\` \`exports\` holds \`./package.json\`, \`.\` where the package has an entry, and **one explicit key per barrel** (\`"./contracts"\` with \`source\` \`./src/contracts/contracts.ts\`, plus \`import\`/\`require\` \`./dist/contracts.js\` and \`types\` \`./dist/contracts.d.ts\`). Never a two-star pattern: declaration emit names a module by splitting an \`exports\` target at its first \`*\`, so a two-star key fails with TS2742.
- **Ward's typecheck, lint, unit and integration checks set the \`source\` condition**, so a package resolves to the TypeScript on disk and an edited contract is visible downstream with no build. Every runtime path that does not set it (the production server, the MCP server, \`npm run build\`) honors \`import\`/\`require\` and reads \`dist/\`, so rebuild the package before running those.

A stub sits beside its contract and a proxy beside the file it mocks. No barrel exports either, and production code never imports one. A test imports each stub and proxy from its own file, through the single-star \`./*.stub\` and \`./*.proxy\` keys, which carry only the \`source\` condition (\`@scope/pkg/contracts/user/user.stub\`, \`@scope/pkg/brokers/user/fetch/user-fetch-broker.proxy\`).

### Consuming another package's API

Import by a **folder-type subpath** (\`@scope/pkg/contracts\`) or from the **main barrel** (\`@scope/pkg\`). Cross-package imports obey the SAME folder rules as local cross-folder imports — the **folder type**, not the package name, decides what is allowed:

- Subpath import → classified by the subpath segment (\`@scope/pkg/contracts\` is a \`contracts\` import).
- Main-barrel import → classified by each imported name's suffix (\`…Contract\` → contracts, \`…Broker\` → brokers, \`…Guard\` → guards, \`…Widget\` → widgets, …).

A \`brokers/\` file may import another package's \`contracts\`/\`brokers\` but not its \`flows\`/\`responders\`/\`widgets\`; a \`contracts/\` file may import only \`contracts\`/\`statics\`/\`errors\`; another package's \`flows/\` is importable only from a \`flows/\` file. Anything outside the workspace comes through \`#gateway\`.

### Starting a new package

Do not hand-write a package's \`tsconfig.json\`, \`tsconfig.build.json\` or \`jest.config.js\`, and do not copy them off a sibling. Run:

\`\`\`bash
dungeonmaster create-package --name <name> --type <packageType>
\`\`\`

It writes every config that package type needs, registers the package in the root \`package.json\`, and seeds \`src/\` so the type detector recognises what it is. A hand-copy reliably loses the \`exclude\` entries keeping \`.stub.ts\` and \`.harness.ts\` out of \`dist\`, the \`incremental\` pair every \`build:clean\` deletes, and the jsdom and JSX setup a \`.tsx\` package needs.

Two rules outlive that command, because each describes an edit someone makes later:

**No config sets \`composite\`, and none carries a \`references\` array.** Nothing consumes project references, and \`composite\` forces every file the program reaches into \`include\` — so one import of a file the build config \`exclude\`s (a \`.test.ts\`, a harness) becomes a hard TS6307 instead of a file the emitter skips.

**A jest config inherits \`testEnvironmentOptions\` from the REPO-ROOT base and never pins its own.** That base alone carries \`customExportConditions: ["source", "require", "default"]\`, which is what makes a test resolve a sibling workspace package to the TypeScript a session just edited instead of to \`dist/\`. Without it a suite grades the last build and goes green over changed source. The published \`@dungeonmaster/testing/jest-config-base\` omits the list deliberately — an INSTALLED package ships \`dist\` only and has no source barrel to resolve to — so spreading the published base inside this monorepo IS the stale-green defect.

## Layer Files - Decomposing Complex Components

**Purpose:** Decompose a file past 300 lines into focused, testable layers that stay inside the parent's domain folder.

**Naming:** \`{descriptive-name}-layer-{folder-suffix}.{ext}\`

The export is the whole filename, in the folder's own export case.

- ✅ \`image-content-layer-widget.tsx\` exports \`ImageContentLayerWidget\`
- ✅ \`validate-folder-depth-layer-broker.ts\` exports \`validateFolderDepthLayerBroker\`
- ❌ \`image-content-layer.tsx\` — no folder suffix
- ❌ \`chat-message-layer-image-content-widget.tsx\` — the descriptive name goes before \`-layer-\`, not after
- ❌ \`image-content-layer-1-widget.tsx\` — never numbered

**Allowed in:** ${allowsLayerFolders} only

Anywhere else \`@dungeonmaster/enforce-project-structure\` rejects the file. A layer skips the domain-prefix check an entry file gets, so its descriptive name need not repeat the folder path — the folder suffix is still checked.

**Structure:** flat beside the parent, never in a subfolder. Every layer carries its own proxy and its own test, and both take the implementation's extension, so a \`.tsx\` layer takes \`.proxy.tsx\` and \`.test.tsx\`.

\`\`\`
widgets/chat-message/
  chat-message-widget.tsx                  # Parent - orchestrates layers
  chat-message-widget.proxy.tsx
  chat-message-widget.test.tsx

  image-content-layer-widget.tsx           # Layer - renders image content blocks
  image-content-layer-widget.proxy.tsx
  image-content-layer-widget.test.tsx

  thinking-layer-widget.tsx                # Layer - renders thinking blocks
  thinking-layer-widget.proxy.tsx
  thinking-layer-widget.test.tsx
\`\`\`

**Import rules:**
- ✅ Parent imports its layers by relative path (\`./image-content-layer-widget\`)
- ✅ Layers import each other the same way
- ❌ No file outside the folder imports a layer — not another domain, not a sibling action in the same domain

**When to create layer:**
- Parent exceeds 300 lines
- Layer calls different dependencies (needs own proxy)
- Layer has distinct responsibility
- Layer needs >10 test cases

**When NOT to create layer:**
- A second folder needs the logic → extract to \`guards/\` or \`transformers/\`
- Logic is <50 lines → keep inline

**Lint Enforcement:** \`enforce-project-structure\` checks the folder allows layers and that \`-layer-\` precedes the suffix; \`enforce-implementation-colocation\` checks the parent, proxy and test all sit in that directory.

## Extension Over Creation Philosophy

**Golden Rule:** If a domain file exists, EXTEND it with options — never create a variant file. Search before creating anything: \`discover({ glob: "packages/*/src/brokers/**", grep: "user" })\`.

**EXTEND** when the change is an option on the same job — a flag (\`includeCompany\`), a filter (\`status?: 'active' | 'inactive'\`), a relation to join.

**CREATE NEW** when it is a different job — a new domain (the first payment broker), a new action (\`user-delete\` beside \`user-fetch\`), a different folder type (\`user-contract\` beside \`user-broker\`), or a second responsibility crowding one file.

**\`transformers/\` invert this rule:** each output shape gets its own file, never an option. An \`includePassword\` flag is how a password hash reaches a public API response.

## Frontend Data Flow (React)

1. **Widgets reach data through bindings, never brokers.** Bindings in the render phase, brokers in event handlers. A binding called from an event handler is a hook inside a callback, which React throws on.

2. **A binding wraps one broker and returns \`{data, loading, error}\`.** A second \`await\` means it is orchestrating, and orchestration belongs in \`brokers/\`.

## Backend Validation (Express/HTTP)

Every responder input from outside the process is \`unknown\` until a contract parses it. Outside means \`req.body\`, \`req.params\`, \`req.query\`, \`job.data\`, \`JSON.parse\` results, stdin, \`useParams()\` and \`localStorage\`.

\`\`\`typescript
export const UserCreateResponder = async ({req, res}: {
  req: Request;
  res: Response;
}): Promise<void> => {
  const body: unknown = req.body;                        // 1. never trust the framework's typing
  const validated = userCreateContract.safeParse(body);  //    safeParse, so bad input is a 400 and not a throw
  if (!validated.success) {
    return res.status(400).json({error: validated.error});
  }

  const user = await userCreateBroker({userData: validated.data});  // 2. every decision happens in the broker
  res.status(201).json(userToDtoTransformer({user}));               // 3. transform out, so internal fields never ship
};
\`\`\`

Those three steps and the status code are the whole job. A responder that branches on a business rule is a broker wearing the wrong suffix.

## Writing a File

Every rule below is enforced by ESLint. A violation is a failed build, not a style note.

### Naming and exports

Filenames are kebab-case. One file exports one thing, as a \`const\` arrow function.

\`\`\`typescript
// user-fetch-broker.ts
export const userFetchBroker = async ({userId}: {userId: User['id']}): Promise<User> => { /* … */ };

// userFetchBroker.ts               ❌ camelCase
// format_date_transformer.ts       ❌ snake_case
// UserContract.ts                  ❌ PascalCase

export function userFetchBroker() {}          // ❌ not an arrow const
export default function userFetchBroker() {}  // ❌ default export
export default class User {}                  // ❌ default export
\`\`\`

Error classes are the one \`export class\` exception. A default export is allowed only where a system genuinely REQUIRES one, never where it merely prefers one. An object type that leaves a function is a contract in \`contracts/\`. A type used only inside one function body stays inline.

Type exports have their own syntax, and the modern-looking one is banned:

\`\`\`typescript
export type User = {id: UserId; name: UserName};  // ✅ defining
export type {User} from './user-contract';        // ✅ re-exporting from a barrel
export {type User} from './user-contract';        // ❌ inline form, banned here
\`\`\`

### Parameters and return types

A function takes ONE object argument, destructured, with the type written inline. The exception is an external API that dictates its own signature.

Every object contract, and every string and number field in it, is branded. A loose parameter, return or local is plain: a scalar read from a loose source is returned plain, and a value that came from a contract keeps its brand. A parameter holding another object's id takes that owner's field type (\`User['id']\`), and \`enforce-owner-field-reuse\` checks it in every folder but \`errors/\`. Every other parameter may be a plain \`string\`.

\`\`\`typescript
export const updateUser = ({user, companyId}: {user: User; companyId: Company['id']}): Promise<User> => { /* … */ };

export const updateUser = (user: User, companyId: CompanyId) => {};    // ❌ positional
export const updateUser = ({user}: UpdateUserParams) => {};            // ❌ named type, not inline
export const noReturnType = ({user}: {user: User}) => {};               // ❌ no return type
export const fetchUser = ({userId}: {userId: string}): Promise<User> => { /* … */ };  // ❌ userId is an owner's id: type it User['id']
\`\`\`

Pass whole objects rather than picking fields off them — that is what keeps the branded relationships intact. Where you genuinely need one identifier, take it as \`User['id']\`.

Branded ids of different owners are deliberately NOT assignable to each other. A field that holds another object's id reuses that id's schema, and parsing one id into another brand is never the answer:

\`\`\`typescript
questId: questContract.shape.id,                           // ✅ the field reuses the owner's schema
const workItemId = workItemContract.shape.id.parse(questId);  // ❌ one id parsed into another brand
const workItemId = questId as unknown as WorkItemId;         // ❌ the assertion is the bug
\`\`\`

**Return what your calls told you.** \`void\` only when every call you discard returned \`void\`. \`{ success: true }\` counts as \`void\`. \`enforce-folder-return-types\` rejects a \`void\` return, or a return type that can hold one value only, when the function discards a call that returned something real.

### File header

Every implementation file opens with this block, ABOVE the imports — not attached to the function, which is where training data puts it. Test, proxy and stub files need none.

\`\`\`typescript
/**
 * PURPOSE: The likely remainder of a quest's execution, continued forward from the work already
 * minted. Reach for this over questSummaryContract when the question is what happens next, not what
 * happened.
 *
 * USAGE:
 * questProjectionContract.parse({questId: 'add-auth', scopes: [], totalPlannedSteps: 0, completedSteps: 0});
 * // Returns a QuestProjection
 *
 * WHEN-TO-USE and WHEN-NOT-TO-USE are optional.
 */
\`\`\`

**PURPOSE carries only what the code cannot state about itself:** why the file exists, and when to reach for THIS one over its nearest sibling. That second sentence is the highest-value line in the header and the one most often missing — a reader scanning \`discover\` output already has the name and the signature, and cannot get "which of these three is mine" anywhere else.

Anything derivable from the file below will drift, so it goes in neither PURPOSE nor USAGE:

\`\`\`typescript
// ❌ PURPOSE: Parses a JSON string and returns the parsed value or undefined on failure
//    Return shape — drifts the day it returns a discriminated result instead

// ❌ PURPOSE: Zod schema for validating absolute file paths; throws when the path is empty
//    The zod chain IS the spec, and .refine() already carries the message

// ❌ PURPOSE: Transformer that transforms a quest into quest rows
//    Restates the filename and says nothing else

// ❌ PURPOSE: Takes {questId, flowId} and returns a QaChecklist
//    Parameters and return type, both already in the signature
\`\`\`

The worst header restates the chain below it AND gets a detail wrong, so it spends its only line on what the code already says and none on the question a reader arrives with.

**PURPOSE must exist before the file does, and must be rewritten once the file is real.** The pre-edit lint hook refuses a write without it, so the header you first submit is necessarily written against a plan rather than an implementation — which is the drift this rule exists to catch. Treat that first one as a placeholder. Before you leave the file, read the body you actually wrote and REWRITE the header to describe it.

The two lines that go stale hardest are the ones worth re-reading: a PURPOSE naming a sibling the file no longer competes with, and a USAGE whose call no longer typechecks.

### Types

An object contract and every string and number field in it carry a brand, \`.brand<'QuestId'>()\` on \`questContract\`'s \`id\`. A field that holds another object's field reuses that schema (\`questId: questContract.shape.id\`) rather than minting a second brand.

Never suppress a type error — \`@ts-ignore\` and \`@ts-expect-error\` are banned outright, and the fix is the contract the value actually needed. Every exported function declares its return type. Anything arriving from outside the process is \`unknown\` until a contract parses it.

\`\`\`typescript
const users: User[] = [];                    // ✅ explicit, because an empty literal infers never[]
const userId = user.id;                      // ✅ inferred, already branded
const data: any = response.data;             // ❌ loses everything

const config = {apiUrl, port} satisfies Partial<Config>;  // ✅ validates shape, keeps literals
const data = apiResponseContract.parse(JSON.parse(response));  // ✅ a contract parses outside data
const broken = {} as ComplexType;                         // ❌ hides every missing property
\`\`\`

\`as\` is for information the compiler lacks, never for silencing it and never for parsing outside data.

### Control flow

Use \`async\`/\`await\`, and \`Promise.all\` whenever the calls do not depend on each other. Sequential \`await\`s are for when the second call needs the first one's result.

Indeterminate loops are recursion with an early return — walking up a directory tree, resolving a config. \`while (true)\` is banned. Ordinary \`for\`, \`.map\`, \`.filter\` over a known collection are fine.

Reach for a \`Map\` or \`Set\` before a nested \`.find\` inside a \`.filter\`; dataset sizes here are unknown. A local holding a plain number stays plain:

\`\`\`typescript
const indexMap = new Map<ChatEntry, number>();  // ✅
\`\`\`

### Errors

Every failure is logged, thrown, or handled. A \`.catch\` that does none of those is a lint error, and there is no wording that gets past it:

\`\`\`typescript
promise.catch(() => undefined);                 // ❌ silent swallow
promise.catch(() => {});                        // ❌ empty
promise.catch((_err) => { /* comment only */ }); // ❌ a comment is not handling

promise.catch((error: unknown) => {             // ✅ fire-and-forget: log, do not block
  process.stderr.write('[context] failed: ' + String(error) + '\\n');
});
\`\`\`

An error message names the operation and the input that broke it. \`throw new Error('Config load failed')\` tells the next reader neither.

### Two syntax traps

\`\`\`typescript
Reflect.deleteProperty(require.cache, resolvedPath);  // ✅
delete require.cache[resolvedPath];                    // ❌ computed key

process.stdout.write('Processed ' + count + ' files\\n');  // ✅ CLI output, newline explicit
console.log('Processed ' + count + ' files');              // ❌
\`\`\`

\`Reflect.get\` and \`Reflect.set\` are confined to \`*-guard.ts\` and \`*-contract.ts\`. Everywhere else they return \`unknown\` and skip validation, which is how they became a universal escape hatch. Parse the shape through a contract at the boundary and read the fields directly.

Delete dead code as you go — unused parameters, unreachable branches, commented-out blocks, stray \`console.log\`.

### Present-Tense Documentation

Documentation states what the code does NOW. This binds code comments, JSDoc, \`PURPOSE\` lines, test descriptions, and CLAUDE.md files alike — never "used to do", "previously", "historically", or "before the X fix". Git is the history.

When the current design needs rationale, state that rationale in present tense ("keys on toolUseId because…") rather than as a contrast with an implementation that no longer exists. When you remove code, remove every comment that refers to what you removed.

### Testing Architecture

Mocks go at I/O boundaries and nowhere else. The proxy of the file that calls a gateway wrapper composes that wrapper's proxy, imported from its own file. MSW answers HTTP and WebSocket. A global mock covers non-determinism like \`Date.now\`, and every broker, guard, transformer and widget runs real. The \`.proxy.ts\` beside each file does that setup and exposes scenario methods rather than raw mocks.

**Get full testing guidance:** Use \`get-testing-patterns\` tool for complete philosophy, proxy patterns, and assertion rules.

`;

  return markdown;
};
