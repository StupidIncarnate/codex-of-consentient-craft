import { formatFileMetadataSectionLayerBroker } from './format-file-metadata-section-layer-broker';
import { formatFileMetadataSectionLayerBrokerProxy } from './format-file-metadata-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatFileMetadataSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for file metadata rules', () => {
    formatFileMetadataSectionLayerBrokerProxy();

    const result = formatFileMetadataSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## File Metadata Documentation',
        '',
        '**Every implementation file must have structured metadata comments at the very top (before imports)**',
        '',
        '**Required format:**',
        '```typescript',
        '/** * PURPOSE: [One-line description] * * USAGE: * [Code example] * // [Comment explaining what it returns] */',
        '```',
        '',
        '**Required for:**',
        '- All implementation files (-adapter.ts, -broker.ts, -guard.ts, -transformer.ts, -contract.ts, -statics.ts, etc.)',
        '',
        '**Not required for:**',
        '- Test files (.test.ts)',
        '- Proxy files (.proxy.ts)',
        '- Stub files (.stub.ts)',
        '',
        '**Optional fields:**',
        '- WHEN-TO-USE',
        '- WHEN-NOT-TO-USE',
        '',
        '**Example:**',
        '```typescript',
        '/** * PURPOSE: Validates if a user has permission to perform an action * * USAGE: * hasPermissionGuard({user, permission: "admin:delete"}); * // Returns true if user has permission, false otherwise * * WHEN-TO-USE: Before executing privileged operations * WHEN-NOT-TO-USE: For public endpoints that don\'t require authorization */',
        '```',
        '',
        '### What Belongs in PURPOSE',
        '',
        '**PURPOSE carries what the code cannot state about itself**',
        '',
        '**MUST NOT contain — every item here is derivable from the file, so prose restating it can only drift:**',
        '- What the function returns, or its return shape ("returns the value or undefined", "returns a discriminated result")',
        '- Whether it throws, and on what',
        '- What a contract validates or enforces — absoluteness, non-empty, format, enum membership. The zod chain IS the spec, and .refine() already carries a human-readable message',
        '- Parameter names, types, or shapes',
        '- A restatement of the file or function name',
        '',
        '**MUST contain, in one or two sentences:**',
        '- Why this exists — the problem it solves',
        '- When to reach for THIS one rather than its nearest sibling',
        '- Any non-obvious rationale, in present tense',
        '',
        'The when-to-reach-for-THIS-one sentence is the highest-value line in the header and the one most often missing. A reader scanning discover output already has the name and the signature; what it cannot get anywhere else is which of several similar files is the right one — absoluteFilePathContract vs repoRelativePathContract vs pathSegmentContract, or plannerMinionStatics vs workerMinionStatics.',
        '',
        'Write PURPOSE LAST. Author the implementation first, then write PURPOSE as a summary of code that already exists. A PURPOSE written before the body describes intent, and intent and implementation diverge silently in the same authoring pass.',
        '',
        'USAGE is unchanged — a concrete call and what comes back.',
        '',
        '**Worked examples in this repo:**',
        '- packages/shared/src/contracts/file-path/file-path-contract.ts carries "PURPOSE: Zod schema for validating any file path (absolute or relative)" over the USAGE line "// Returns branded FilePath type that accepts both absolute and relative paths", above z.union([absoluteFilePathContract, relativeFilePathContract]) whose relative branch requires a ./ or ../ prefix — so a bare packages/shared/src/x.ts is REJECTED, and the colocated file-path-contract.test.ts pins that: its INVALID: {path: "relative/path.ts"} case asserts the parse throws "Path must be absolute". FilePath is referenced ~1,300 times across the repo, which makes this the most-read wrong line in it. The zod chain already states what is accepted; what the header owes the reader instead is one sentence on when to reach for absoluteFilePathContract, repoRelativePathContract, or pathSegmentContract.',
        '',
        '**Example:**',
        '```typescript',
        '/** * PURPOSE: Accepts a path already known to live inside the repo. Reach for this over pathSegmentContract when the value must reject an absolute prefix, and over absoluteFilePathContract when the value is persisted to a quest file that has to stay portable across machines. */',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        '/** * PURPOSE: Parses a JSON string and returns the parsed value or undefined on failure */ // Return shape - derivable, and it drifts the day the function returns a discriminated result instead',
        '/** * PURPOSE: Zod schema for validating absolute file paths; throws when the path is empty or not absolute */ // The zod chain IS the spec, and .refine() already carries the message',
        '/** * PURPOSE: Transformer that transforms a quest into quest rows */ // Restates the file name and says nothing else',
        '/** * PURPOSE: Takes {questId, flowId} and returns a QaChecklist */ // Parameter names and return type - both already in the signature',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
