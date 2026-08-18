import {
  QuestBlightLedgerEntryStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';

import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { questGetBlightChecklistBroker } from './quest-get-blight-checklist-broker';
import { questGetBlightChecklistBrokerProxy } from './quest-get-blight-checklist-broker.proxy';

describe('questGetBlightChecklistBroker', () => {
  describe('quest with a pinned baseRef', () => {
    it('VALID: {baseRef, non-empty diff} => returns a checklist whose baseRef matches and mirrors the transformer output', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
      });

      expect(result).toStrictEqual(
        blightChecklistBuildTransformer({
          changedFiles: [
            RepoRelativePathStub({ value: 'packages/web/src/widgets/foo/foo-widget.tsx' }),
          ],
          ledger: quest.planningNotes.blightLedger,
          baseRef: quest.baseRef!,
        }),
      );
    });

    it('VALID: {ledger entry for a unit} => remainingItemIds reflects the persisted blightLedger', async () => {
      const changedFiles = [
        RepoRelativePathStub({ value: 'packages/web/src/widgets/foo/foo-widget.tsx' }),
      ];
      const baseline = blightChecklistBuildTransformer({
        changedFiles,
        ledger: [],
        baseRef: 'a1b2c3d4' as never,
      });
      const ledgerEntry = QuestBlightLedgerEntryStub({ itemId: baseline.items[0]!.id });

      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({
        baseRef: 'a1b2c3d4' as never,
        planningNotes: { blightLedger: [ledgerEntry] },
      });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: changedFiles.map((file) => String(file)) });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
      });

      expect(result?.remainingItemIds).toStrictEqual(
        blightChecklistBuildTransformer({
          changedFiles,
          ledger: [ledgerEntry],
          baseRef: quest.baseRef!,
        }).remainingItemIds,
      );
    });

    it('VALID: {baseRef} => the git adapter is called with the quest baseRef', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'deadbeef...HEAD', '--name-only']);
    });

    // A caller auditing one landed commit needs HEAD~1, not the quest's pinned base — the two
    // measure different diffs, so a scope silently resolving to the wrong one answers a question
    // nobody asked.
    it("VALID: {scope: 'commit'} => the git adapter measures HEAD~1, not the quest baseRef", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'commit',
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'HEAD~1...HEAD', '--name-only']);
    });

    it("VALID: {scope: 'quest'} => the git adapter measures the pinned baseRef, same as omitting scope", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'quest',
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'deadbeef...HEAD', '--name-only']);
    });
  });

  describe("scope: 'working-tree' — the pre-commit surface", () => {
    // THE regression guard. `git diff` in every form reports TRACKED paths only, so a file a
    // session has just created is in no diff at all. A reviewer that runs before its host session
    // commits sees mostly net-new files, so a working-tree scope blind to untracked additions
    // returns a green-looking checklist having never opened the files most likely to carry a
    // defect. Assert on the enumerated implPaths, not on a count.
    it('VALID: {one tracked modification and one NET-NEW UNTRACKED file} => both files carry review units', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupWorkingTreeDiff({
        trackedFiles: ['packages/orchestrator/src/brokers/foo/foo-broker.ts'],
        untrackedFiles: ['packages/orchestrator/src/brokers/brand-new/brand-new-broker.ts'],
      });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'working-tree',
      });

      expect([...new Set(result!.items.map((item) => String(item.implPath)))]).toStrictEqual([
        'packages/orchestrator/src/brokers/brand-new/brand-new-broker.ts',
        'packages/orchestrator/src/brokers/foo/foo-broker.ts',
      ]);
    });

    it("VALID: {scope: 'working-tree'} => git is read twice — a rangeless HEAD diff and an ls-files for the untracked half", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupWorkingTreeDiff({ trackedFiles: [], untrackedFiles: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'working-tree',
      });

      expect(proxy.getGitArgsList()).toStrictEqual([
        ['diff', 'HEAD', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
      ]);
    });

    // The other two scopes are measurements AGAINST the review base, so an unpinned quest has
    // nothing for them to measure. This one is measured from HEAD alone — gating it on `baseRef`
    // would answer null, read downstream as "nothing to review", for the surface that has the most.
    it('VALID: {no pinned baseRef} => still returns a checklist, because HEAD is the only reference this scope needs', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({});
      proxy.setupQuestFound({ quest });
      proxy.setupWorkingTreeDiff({
        trackedFiles: [],
        untrackedFiles: ['packages/orchestrator/src/brokers/brand-new/brand-new-broker.ts'],
      });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'working-tree',
      });

      expect([...new Set(result!.items.map((item) => String(item.implPath)))]).toStrictEqual([
        'packages/orchestrator/src/brokers/brand-new/brand-new-broker.ts',
      ]);
    });

    it('VALID: {quest records a worktreePath} => both git readings run inside that worktree, not the repo root', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupWorktree({ quest, worktreePath: '/home/testuser/worktrees/quest-abc12345' });
      proxy.setupWorkingTreeDiff({ trackedFiles: [], untrackedFiles: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'working-tree',
      });

      expect(proxy.getGitDiffCwd()).toBe('/home/testuser/worktrees/quest-abc12345');
    });
  });

  // The scope the signal-back review-coverage gate calls with: the base is a WORK ITEM's recorded
  // fork point, which is neither the quest's pinned base nor a fixed offset from HEAD.
  describe("scope: 'since-ref' — a base the caller names", () => {
    it("VALID: {scope: 'since-ref', sinceRef} => the git adapter measures that ref, not the quest baseRef", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'since-ref',
        sinceRef: 'cafebabe' as never,
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'cafebabe...HEAD', '--name-only']);
    });

    it("VALID: {scope: 'since-ref', sinceRef, changed files} => the checklist is built over that range", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: ['packages/orchestrator/src/brokers/foo/foo-broker.ts'] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'since-ref',
        sinceRef: 'cafebabe' as never,
      });

      expect([...new Set(result!.items.map((item) => String(item.implPath)))]).toStrictEqual([
        'packages/orchestrator/src/brokers/foo/foo-broker.ts',
      ]);
    });

    // A caller naming this scope and no ref has named no base at all — the same unmeasurable state
    // an unpinned `baseRef` puts `quest`/`commit` in, and answered the same way so
    // `blightCoverageOutstandingTransformer` reads it as nothing outstanding rather than wedging a
    // session against a surface it cannot compute.
    it("EMPTY: {scope: 'since-ref', no sinceRef} => returns null and never reaches git", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'since-ref',
      });

      expect({ result, gitDiffArgs: proxy.getGitDiffArgs() }).toStrictEqual({
        result: null,
        gitDiffArgs: undefined,
      });
    });

    // `sinceRef` belongs to ONE scope. A caller that passes it alongside another scope gets that
    // scope's own reading unchanged — which is what keeps the three original scopes provably
    // untouched by this parameter rather than merely untested against it.
    it("VALID: {scope: 'quest' WITH a sinceRef} => the pinned baseRef still wins, because sinceRef is read by 'since-ref' alone", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'quest',
        sinceRef: 'cafebabe' as never,
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'deadbeef...HEAD', '--name-only']);
    });

    it("VALID: {scope: 'commit' WITH a sinceRef} => HEAD~1 still wins", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'commit',
        sinceRef: 'cafebabe' as never,
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'HEAD~1...HEAD', '--name-only']);
    });

    it("VALID: {scope: 'working-tree' WITH a sinceRef} => still the rangeless HEAD reading plus ls-files", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupWorkingTreeDiff({ trackedFiles: [], untrackedFiles: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'working-tree',
        sinceRef: 'cafebabe' as never,
      });

      expect(proxy.getGitArgsList()).toStrictEqual([
        ['diff', 'HEAD', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
      ]);
    });

    // What the signal-back review-coverage gate reads is `remainingItemIds`, and a unit leaves that
    // list the moment ANY disposition names it. `gap` and `recorded` are the honest answers for a
    // concern that cannot be assessed or a finding handed to a named owner, so if either left the
    // unit remaining the gate would be unsatisfiable without lying — it refuses ABSENCE, not
    // honesty.
    it.each(['gap', 'recorded'])(
      "VALID: {scope: 'since-ref', a '%s' disposition on a unit} => that unit is no longer remaining",
      async (disposition) => {
        const changedFile = 'packages/orchestrator/src/brokers/foo/foo-broker.ts';
        const proxy = questGetBlightChecklistBrokerProxy();
        const quest = QuestStub({
          baseRef: 'deadbeef' as never,
          planningNotes: {
            blightLedger: [
              QuestBlightLedgerEntryStub({
                itemId: `${changedFile}:craft`,
                disposition: disposition as never,
              }),
            ],
          },
        });
        proxy.setupQuestFound({ quest });
        proxy.setupDiff({ files: [changedFile] });

        const result = await questGetBlightChecklistBroker({
          questId: QuestIdStub({ value: quest.id }),
          scope: 'since-ref',
          sinceRef: 'cafebabe' as never,
        });

        expect(result!.remainingItemIds.map(String)).toStrictEqual([
          `${changedFile}:perf`,
          `${changedFile}:dedup`,
          `${changedFile}:integrity`,
          `${changedFile}:test-cases`,
        ]);
      },
    );

    it("VALID: {scope: 'since-ref', empty range} => a checklist with zero items, which is a round that committed nothing", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'since-ref',
        sinceRef: 'cafebabe' as never,
      });

      expect({ items: result?.items, remaining: result?.remainingItemIds }).toStrictEqual({
        items: [],
        remaining: [],
      });
    });
  });

  describe("scope: 'unpushed' — one round, framed by what has not been published", () => {
    it("VALID: {scope: 'unpushed', branch tracks an upstream} => the git adapter measures that upstream sha", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupUpstream({ sha: 'cafebabe' });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'unpushed',
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'cafebabe...HEAD', '--name-only']);
    });

    it("VALID: {scope: 'unpushed', changed files} => the checklist is built over that range", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupUpstream({ sha: 'cafebabe' });
      proxy.setupDiff({ files: ['packages/orchestrator/src/brokers/foo/foo-broker.ts'] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'unpushed',
      });

      expect([...new Set(result!.items.map((item) => String(item.implPath)))]).toStrictEqual([
        'packages/orchestrator/src/brokers/foo/foo-broker.ts',
      ]);
    });

    // Over-reporting on purpose. A reviewer handed null reads it as "nothing to review" and
    // dispositions nothing, which is the one failure this scope exists to avoid; a reviewer handed
    // the whole quest re-reads files that already carry a disposition, which costs a pass and
    // hides nothing.
    it("VALID: {scope: 'unpushed', branch tracks NOTHING} => falls back to the quest's pinned baseRef", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupNoUpstream();
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'unpushed',
      });

      expect(proxy.getGitDiffArgs()).toStrictEqual(['diff', 'deadbeef...HEAD', '--name-only']);
    });

    it("EMPTY: {scope: 'unpushed', no upstream AND no pinned baseRef} => returns null", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub();
      proxy.setupQuestFound({ quest });
      proxy.setupNoUpstream();

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'unpushed',
      });

      // `getGitDiffArgs` answers the LAST `git` argv the broker spawned, and this scope always
      // spawns the upstream probe before it can know there is no base. Seeing the PROBE there
      // rather than a `diff` is exactly the proof that no diff followed it: had one run, it would
      // be the last spawn. Asserting `undefined` here would require the broker to somehow know the
      // branch tracks nothing without asking git.
      expect({ result, lastGitArgs: proxy.getGitDiffArgs() }).toStrictEqual({
        result: null,
        lastGitArgs: ['rev-parse', '@{upstream}'],
      });
    });

    // The upstream lookup belongs to ONE scope, exactly as `sinceRef` does. These keep the other
    // scopes provably untouched by it rather than merely untested against it.
    it("VALID: {scope: 'quest'} => never asks git for an upstream, and the pinned baseRef wins", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'quest',
      });

      expect({
        diffArgs: proxy.getGitDiffArgs(),
        upstreamAsked: proxy.wasUpstreamAsked(),
      }).toStrictEqual({
        diffArgs: ['diff', 'deadbeef...HEAD', '--name-only'],
        upstreamAsked: false,
      });
    });

    it("VALID: {scope: 'commit'} => never asks git for an upstream, and HEAD~1 wins", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'deadbeef' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
        scope: 'commit',
      });

      expect({
        diffArgs: proxy.getGitDiffArgs(),
        upstreamAsked: proxy.wasUpstreamAsked(),
      }).toStrictEqual({
        diffArgs: ['diff', 'HEAD~1...HEAD', '--name-only'],
        upstreamAsked: false,
      });
    });
  });

  describe("the quest's own package declarations reach the units", () => {
    it('VALID: {packagesAffected declaring a location the changed file sits under} => the units carry that package', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({
        baseRef: 'a1b2c3d4' as never,
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
      });

      expect([...new Set(result!.items.map((item) => String(item.packageName)))]).toStrictEqual([
        'web',
      ]);
    });

    it('VALID: {packagesAffected declaring an absolute location under the resolved cwd} => reduced against that cwd and still resolved', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({
        baseRef: 'a1b2c3d4' as never,
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: '/home/testuser/my-guild/packages/web',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
      });

      expect([...new Set(result!.items.map((item) => String(item.packageName)))]).toStrictEqual([
        'web',
      ]);
    });
  });

  describe('quest with no pinned baseRef', () => {
    it('EMPTY: {no baseRef} => returns null rather than throwing', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({});
      proxy.setupQuestFound({ quest });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
      });

      expect(result).toBe(null);
    });
  });

  describe('empty diff', () => {
    it('EMPTY: {baseRef, empty diff} => returns a checklist with zero items', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      const result = await questGetBlightChecklistBroker({
        questId: QuestIdStub({ value: quest.id }),
      });

      expect(result?.items).toStrictEqual([]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => throws not found error', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetBlightChecklistBroker({ questId: QuestIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Quest with id "nonexistent" not found/u);
    });
  });

  describe('quest cwd resolution', () => {
    it('VALID: {quest records a worktreePath} => the diff is computed with that worktree path as cwd', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupWorktree({ quest, worktreePath: '/home/testuser/worktrees/quest-abc12345' });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(proxy.getGitDiffCwd()).toBe('/home/testuser/worktrees/quest-abc12345');
    });

    it('VALID: {quest records no worktreePath} => the diff is computed with the resolved repo root as cwd', async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      await questGetBlightChecklistBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(proxy.getGitDiffCwd()).toBe('/home/testuser/my-guild');
    });

    it("ERROR: {quest's recorded worktree is missing on disk} => throws naming the absolute path, and no diff is requested", async () => {
      const proxy = questGetBlightChecklistBrokerProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupWorktreeMissing({
        quest,
        worktreePath: '/home/testuser/worktrees/quest-missing99',
      });

      await expect(
        questGetBlightChecklistBroker({ questId: QuestIdStub({ value: quest.id }) }),
      ).rejects.toThrow(
        /Cannot compute the blight checklist for quest .*: worktree not found: \/home\/testuser\/worktrees\/quest-missing99/u,
      );

      expect(proxy.getGitDiffArgs()).toBe(undefined);
    });
  });
});
