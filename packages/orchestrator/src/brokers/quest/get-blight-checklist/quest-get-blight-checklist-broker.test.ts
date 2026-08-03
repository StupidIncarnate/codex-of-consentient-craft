import {
  QuestBlightLedgerEntryStub,
  QuestIdStub,
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
});
