/**
 * PURPOSE: Decomposes a quest diff's changed files into the complete, deterministically-enumerated
 * blightwarden review surface — every changed impl file, with its test/proxy/stub companions
 * collapsed onto it, crossed with every BlightConcern — and reports which of those units still
 * carry no disposition in the quest's blight ledger
 *
 * USAGE:
 * blightChecklistBuildTransformer({
 *   changedFiles: ['packages/web/src/widgets/quest-chat/quest-chat-widget.tsx', '...test.tsx'],
 *   ledger: quest.planningNotes.blightLedger,
 *   baseRef: quest.baseRef,
 * });
 * // Returns BlightChecklist — the complete surface, plus `remainingItemIds`
 *
 * NO MODEL IS IN THIS LOOP, and that is the entire point. A session asked to enumerate a 30-file
 * diff summarises, drops the tail, or re-slices it differently on every pass — three consecutive
 * review sessions on one real quest re-partitioned the same files 4 → 6 → 9 ways and each found a
 * disjoint set of problems. This walks the changed-file list and cannot. Ids are derived from
 * `implPath` + `concern` rather than minted, so re-running against the same changed-file set
 * reproduces byte-identical ids and a later session resumes against what a predecessor actually
 * landed instead of re-deriving its pass from prose.
 *
 * PAIRING: a changed test/proxy/stub file collapses onto the impl it belongs to, so one impl+test
 * pair is ONE unit group rather than four. `.json`/`.md`/`.yml`/`.yaml`/lockfiles and anything under
 * `.claude/` are excluded entirely — they are not reviewable source. `.e2e.ts` and `.harness.ts`
 * have no implementation counterpart and are always their own group. Every other changed file has
 * its FIRST matching marker stripped (longest marker first, so `.integration.test.ts` is never
 * mistaken for a bare `.test.ts`) to find the group it belongs to; a file with no marker IS the impl
 * file for its group — its own (stripped) path is exactly the group's base, which is how the
 * resolution pass below re-derives it without needing a separate flag. A changed test whose
 * implementation is unchanged still yields a group, and that group still pulls the (unchanged) impl
 * path into scope — a test-only diff still needs its implementation read to judge whether the test
 * asserts anything.
 *
 * `.stub.ts` is the one marker whose base is NOT the bare stripped path: stripping alone yields
 * `<domain>`, but a stub's implementation is `<domain>-contract.ts`, so `-contract` is appended to
 * land it in the same group. `contracts` is the only folder type declaring `.stub.ts` in its
 * `folderConfigStatics.fileSuffix` (and the only one with `requireStub: true`), so a stub is always
 * a contract companion and this rule has no other case to serve. Stripping alone instead invents an
 * impl path — `torch-fuel.stub.ts` becomes a group headed `torch-fuel.ts`, a file that does not
 * exist — which pads the review surface with unopenable paths while the real `-contract.ts` group
 * sits beside it, and the completion gate cannot tell the difference because it checks for the
 * ABSENCE of a disposition, never whether the unit's path resolves.
 */

import {
  blightChecklistContract,
  blightChecklistItemContract,
  blightConcernContract,
  repoRelativePathContract,
} from '@dungeonmaster/shared/contracts';
import type {
  BlightChecklist,
  Quest,
  QuestBlightLedgerEntry,
  RepoRelativePath,
} from '@dungeonmaster/shared/contracts';

// The concern half of every unit's label, colocated here so the wording lives in one place. `{file}`
// is substituted with the impl path's basename at generation time. Deliberately NOT type-annotated
// as `Record<BlightConcern, string>` (a raw `string` value type outside a function parameter is
// banned repo-wide) — instead, indexing this object below with a `BlightConcern`-typed key is what
// TypeScript checks: a concern missing its entry here shrinks this object's inferred key set below
// `BlightConcern`, and the indexed lookup fails to compile. Adding a concern to `blightConcernContract`
// without adding its description here is therefore still a compile error, not a blank label.
const blightConcernDescriptions = {
  coverage: 'every branch in {file} has a real test',
  craft:
    "{file}'s logic matches its signature, its error handling carries real context, and nothing needless remains",
  security: 'no untrusted input in {file} reaches a dangerous sink without a validating contract',
  dedup:
    '{file} introduces no semantic duplication, within this diff or against existing repo code',
  perf: '{file} has no quadratic loops, N+1 queries, sync I/O in async code, or unbounded work',
  integrity: "every consumer of {file}'s changed exports still works",
  'dead-code': '{file} carries no orphan exports or unreachable branches',
};

export const blightChecklistBuildTransformer = ({
  changedFiles,
  ledger = [],
  baseRef,
}: {
  changedFiles: readonly RepoRelativePath[];
  ledger?: readonly QuestBlightLedgerEntry[];
  baseRef: NonNullable<Quest['baseRef']>;
}): BlightChecklist => {
  const selfPairedFiles: RepoRelativePath[] = [];
  const groups = new Map<RepoRelativePath, RepoRelativePath[]>();

  for (const file of changedFiles) {
    const filePath = String(file);

    const isExcluded =
      filePath.endsWith('.json') ||
      filePath.endsWith('.md') ||
      filePath.endsWith('.yml') ||
      filePath.endsWith('.yaml') ||
      filePath.endsWith('.lock') ||
      filePath.startsWith('.claude/') ||
      filePath.includes('/.claude/');
    if (isExcluded) {
      continue;
    }

    if (filePath.endsWith('.e2e.ts') || filePath.endsWith('.harness.ts')) {
      selfPairedFiles.push(file);
      continue;
    }

    const base = repoRelativePathContract.parse(
      filePath.endsWith('.integration.test.ts')
        ? filePath.slice(0, -'.integration.test.ts'.length)
        : filePath.endsWith('.test.tsx')
          ? filePath.slice(0, -'.test.tsx'.length)
          : filePath.endsWith('.test.ts')
            ? filePath.slice(0, -'.test.ts'.length)
            : filePath.endsWith('.proxy.tsx')
              ? filePath.slice(0, -'.proxy.tsx'.length)
              : filePath.endsWith('.proxy.ts')
                ? filePath.slice(0, -'.proxy.ts'.length)
                : filePath.endsWith('.stub.ts')
                  ? `${filePath.slice(0, -'.stub.ts'.length)}-contract`
                  : filePath.replace(/\.[^./]+$/u, ''),
    );

    const filesInGroup = groups.get(base) ?? ([] as RepoRelativePath[]);
    filesInGroup.push(file);
    groups.set(base, filesInGroup);
  }

  const resolvedGroups: { implPath: RepoRelativePath; pairedFiles: RepoRelativePath[] }[] = [
    ...selfPairedFiles.map((file) => ({ implPath: file, pairedFiles: [] as RepoRelativePath[] })),
    ...[...groups.entries()].map(([base, files]) => {
      // A markerless file's own (stripped) path IS the group's base — that equivalence is how a
      // present impl file is told apart from a group made only of its test/proxy/stub companions,
      // without tracking a separate flag through the loop above.
      const markerlessFile =
        files.find((groupFile) => String(groupFile) === `${base}.ts`) ??
        files.find((groupFile) => String(groupFile) === `${base}.tsx`);
      const hasTsxFile = files.some((groupFile) => String(groupFile).endsWith('.tsx'));
      const implPath =
        markerlessFile ?? repoRelativePathContract.parse(`${base}${hasTsxFile ? '.tsx' : '.ts'}`);
      return {
        implPath,
        pairedFiles: files.filter((groupFile) => groupFile !== implPath).sort(),
      };
    }),
  ];
  resolvedGroups.sort((a, b) => (a.implPath < b.implPath ? -1 : a.implPath > b.implPath ? 1 : 0));

  const items = resolvedGroups.flatMap(({ implPath, pairedFiles }) => {
    const basename = String(implPath).split('/').pop() ?? String(implPath);
    return blightConcernContract.options.map((concern) =>
      blightChecklistItemContract.parse({
        id: `${String(implPath)}:${concern}`,
        implPath,
        concern,
        pairedFiles,
        label: `${concern} — ${blightConcernDescriptions[concern].replace('{file}', basename)}`,
      }),
    );
  });

  const dispositionedIds = new Set(ledger.map((entry) => String(entry.itemId)));

  return blightChecklistContract.parse({
    baseRef,
    items,
    remainingItemIds: items
      .filter((item) => !dispositionedIds.has(String(item.id)))
      .map((item) => item.id),
  });
};
