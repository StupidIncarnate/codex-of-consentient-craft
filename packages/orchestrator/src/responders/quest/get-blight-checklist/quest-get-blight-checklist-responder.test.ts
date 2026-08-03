import { QuestStub, RepoRelativePathStub } from '@dungeonmaster/shared/contracts';

import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { blightChecklistToTextTransformer } from '../../../transformers/blight-checklist-to-text/blight-checklist-to-text-transformer';
import { QuestGetBlightChecklistResponderProxy } from './quest-get-blight-checklist-responder.proxy';

describe('QuestGetBlightChecklistResponder', () => {
  describe('rendering a quest diff', () => {
    it('VALID: {baseRef, non-empty diff} => renders the checklist text', async () => {
      const proxy = QuestGetBlightChecklistResponderProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: blightChecklistToTextTransformer({
          checklist: blightChecklistBuildTransformer({
            changedFiles: [
              RepoRelativePathStub({ value: 'packages/web/src/widgets/foo/foo-widget.tsx' }),
            ],
            ledger: quest.planningNotes.blightLedger,
            baseRef: quest.baseRef!,
          }),
        }),
      });
    });
  });

  describe('no pinned base', () => {
    it('EMPTY: {no baseRef} => states there is no diff to scope, not an error', async () => {
      const proxy = QuestGetBlightChecklistResponderProxy();
      const quest = QuestStub({});
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: 'This quest has no pinned review base (baseRef), so there is no diff to scope. That is a real state, not an error — a quest seeded before the base was pinned cannot have a review scope computed.',
      });
    });
  });

  describe('empty diff', () => {
    it('EMPTY: {baseRef, empty diff} => says there is nothing to disposition', async () => {
      const proxy = QuestGetBlightChecklistResponderProxy();
      const quest = QuestStub({ baseRef: 'a1b2c3d4' as never });
      proxy.setupQuestFound({ quest });
      proxy.setupDiff({ files: [] });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual({
        success: true,
        data: 'There are no changed files to review against the pinned base, so there is nothing to disposition.',
      });
    });
  });

  describe('failures', () => {
    it('ERROR: {quest not found} => returns success false naming the missing quest', async () => {
      const proxy = QuestGetBlightChecklistResponderProxy();
      proxy.setupQuestNotFound();

      const result = await proxy.callResponder({ questId: 'nonexistent' });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });
  });
});
