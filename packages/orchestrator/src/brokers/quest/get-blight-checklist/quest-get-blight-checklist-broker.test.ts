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
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [ledgerEntry] },
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

    // Blightscout is dispatched against ONE COMMIT, and its signal-back completion gate calls this
    // broker with exactly this scope. If the two ever measured different diffs, the session would
    // disposition a set nobody grades and be refused on a set it never saw.
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
