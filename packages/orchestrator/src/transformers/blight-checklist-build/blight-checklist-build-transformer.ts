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
 * CONCERNS: most groups cross every `BlightConcern`, but a DECLARATION-SHAPED group — a
 * `-contract.ts`, a stub/proxy/test companion that resolved to itself, an `.e2e.ts`/`.harness.ts`,
 * a bare `index.ts`, or a re-export file sitting directly in a declared package root — is withheld
 * the concerns `blightConcernGatingStatics.structurallyInertConcerns` names. Which concerns those
 * are, and the measurement behind the cut, live in that statics file; what belongs here is that the
 * gate keys on the GROUP'S `implPath`, never on the changed files that collapsed onto it, so an
 * impl file reviewed only because its test changed still crosses every concern.
 *
 * PACKAGE: each group's `implPath` is matched against the `location` of every entry in the quest's
 * `packagesAffected`, longest prefix winning so a package nested inside another still resolves to
 * itself. The declared locations are the ONLY source — no layout is assumed and no package name is
 * read out of a path, because a quest may run in a repo that does not put its packages under
 * `packages/` at all, and the same name may mean different directories in different repos. A path
 * under none of the declared locations carries no package rather than the nearest one: the partition
 * gives those files their own group, and inventing an owner for them would silently widen a real
 * package's group with files nobody declared.
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
  QuestPackageEntry,
  RepoRelativePath,
  RepoRootCwd,
} from '@dungeonmaster/shared/contracts';

import { blightConcernGatingStatics } from '../../statics/blight-concern-gating/blight-concern-gating-statics';

// The concern half of every unit's label, colocated here so the wording lives in one place. `{file}`
// is substituted with the impl path's basename at generation time. Deliberately NOT type-annotated
// as `Record<BlightConcern, string>` (a raw `string` value type outside a function parameter is
// banned repo-wide) — instead, indexing this object below with a `BlightConcern`-typed key is what
// TypeScript checks: a concern missing its entry here shrinks this object's inferred key set below
// `BlightConcern`, and the indexed lookup fails to compile. Adding a concern to `blightConcernContract`
// without adding its description here is therefore still a compile error, not a blank label.
// The reverse does NOT hold: an EXTRA key here typechecks fine, so a key whose concern is not in
// `blightConcernContract` survives as dead weight until someone deletes it by hand.
const blightConcernDescriptions = {
  craft:
    "{file}'s logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
  perf: '{file} has no quadratic loops, N+1 queries, sync I/O in async code, or unbounded work, and does nothing it need not do at all',
  dedup:
    '{file} introduces no semantic duplication, within this diff or against existing repo code',
  integrity:
    "{file}'s changed exports still MEAN to their consumers what they did, and no stub, fixture, or `.default(...)` papers over a break",
  'test-cases':
    '{file} has a test case for every branch this commit added to it — not whether a spec observable is proven, which is the Flowrider track, but whether the conditional written here was written with a case at all',
};

export const blightChecklistBuildTransformer = ({
  changedFiles,
  ledger = [],
  packagesAffected = [],
  projectRoot,
  baseRef,
}: {
  changedFiles: readonly RepoRelativePath[];
  ledger?: readonly QuestBlightLedgerEntry[];
  packagesAffected?: readonly QuestPackageEntry[];
  projectRoot?: RepoRootCwd;
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

    const hasKnownTestOrProxyMarker =
      filePath.endsWith('.integration.test.ts') ||
      filePath.endsWith('.test.tsx') ||
      filePath.endsWith('.test.ts') ||
      filePath.endsWith('.proxy.tsx') ||
      filePath.endsWith('.proxy.ts') ||
      filePath.endsWith('.stub.ts');

    // The generic strip-and-reconstruct branch below assumes the stripped extension is exactly
    // `.ts`/`.tsx` (it re-appends one of those to resolve the group's implPath), which only holds
    // for TypeScript source files. A bare dotfile like `.gitignore` has no extension to strip — its
    // "extension" IS the whole name — so stripping it would either empty the path (a leading dot
    // with nothing before it) or reconstruct a nonexistent `<name>.ts`. Anything that isn't a known
    // test/proxy/stub companion and isn't itself `.ts`/`.tsx` reviews as its own self-paired unit,
    // the same way `.e2e.ts`/`.harness.ts` do.
    if (!hasKnownTestOrProxyMarker && !filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      selfPairedFiles.push(file);
      continue;
    }

    const strippedBase = filePath.endsWith('.integration.test.ts')
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
                : filePath.replace(/\.[^./]+$/u, '');

    // Every marker above can in principle consume the whole name — a path that IS its own extension
    // (`.ts`) strips to nothing, the same way a bare dotfile does. An empty base fails
    // `repoRelativePathContract`, and because this loop feeds the ENTIRE checklist, one such file
    // takes the whole review surface down rather than degrading. Guard on what the strip PRODUCED
    // rather than on the extension shapes that can produce it, so a future marker cannot reopen this.
    if (strippedBase === '') {
      selfPairedFiles.push(file);
      continue;
    }

    const base = repoRelativePathContract.parse(strippedBase);

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

  // A declared `location` is either absolute or `./`-prefixed against the quest's own project root,
  // while a changed file is repo-relative — so both are reduced to the same repo-relative form
  // before they are compared. An absolute location with no `projectRoot` to reduce it against keeps
  // its leading slash and therefore matches nothing, which routes its files to the residual group
  // rather than to a package this transformer cannot prove they belong to.
  const projectRootPrefix =
    projectRoot === undefined ? '' : `${String(projectRoot).replace(/\/+$/u, '')}/`;

  // Longest prefix first, so a package declared inside another package's tree claims its own files
  // instead of losing them to the enclosing declaration.
  const declaredPackages = packagesAffected
    .map((entry) => {
      const declared = String(entry.location).replace(/\/+$/u, '');
      const rooted =
        projectRootPrefix.length > 0 && declared.startsWith(projectRootPrefix)
          ? declared.slice(projectRootPrefix.length)
          : declared;
      return { name: entry.name, prefix: rooted.replace(/^\.\//u, '') };
    })
    .filter((declared) => declared.prefix.length > 0)
    .sort((a, b) => b.prefix.length - a.prefix.length);

  const items = resolvedGroups.flatMap(({ implPath, pairedFiles }) => {
    const implPathText = String(implPath);
    const basename = implPathText.split('/').pop() ?? implPathText;
    const owningPackage = declaredPackages.find(
      (declared) =>
        implPathText === declared.prefix || implPathText.startsWith(`${declared.prefix}/`),
    );

    // A barrel is either a bare `index.ts` anywhere, or a re-export file sitting DIRECTLY in a
    // declared package's root (`packages/shared/contracts.ts`) — the shape this repo's cross-package
    // public API takes, since those root barrels live outside `src/`. The declared location is the
    // only honest test for the second form: the transformer refuses to read a package out of a path
    // shape anywhere else (see PACKAGE above), and inventing a `packages/<x>/<y>.ts` rule here would
    // reintroduce exactly that assumption for a repo that lays its packages out differently.
    const isBarrel =
      basename === blightConcernGatingStatics.barrelBasename ||
      (owningPackage !== undefined && implPathText === `${owningPackage.prefix}/${basename}`);

    // `perf` against a zod contract, and `integrity` against a brand-new file whose only consumer
    // arrives in the same commit, are STRUCTURALLY incapable of firing — they can be dispositioned
    // "n/a" and nothing else. Measured: those two concerns produced 0 findings across 88 units of
    // exactly this file mix. The other three still apply here in full, so a declaration-shaped file
    // keeps a unit group rather than dropping out of review.
    const isDeclarationShaped =
      isBarrel ||
      blightConcernGatingStatics.inertImplSuffixes.some((suffix) => implPathText.endsWith(suffix));

    const concerns = isDeclarationShaped
      ? blightConcernContract.options.filter(
          (concern) =>
            !blightConcernGatingStatics.structurallyInertConcerns.some(
              (inert) => inert === concern,
            ),
        )
      : blightConcernContract.options;

    return concerns.map((concern) =>
      blightChecklistItemContract.parse({
        id: `${implPathText}:${concern}`,
        implPath,
        concern,
        ...(owningPackage === undefined ? {} : { packageName: owningPackage.name }),
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
