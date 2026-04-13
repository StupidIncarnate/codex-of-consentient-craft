import { QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestVerifyResponderProxy } from './quest-verify-responder.proxy';

describe('QuestVerifyResponder', () => {
  describe('successful verification', () => {
    it('VALID: {questId} => returns verify result via broker', async () => {
      const quest = QuestStub();
      const proxy = QuestVerifyResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      const { success, checks } = result;

      expect(success).toBe(true);
      expect(checks.map((c) => c.name)).toStrictEqual([
        'Observable Coverage',
        'Dependency Integrity',
        'No Circular Dependencies',
        'File Companion Completeness',
        'No Raw Primitives in Contracts',
        'Step Contract Declarations',
        'Valid Contract References',
        'Step Export Names',
        'Valid Flow References',
        'No Orphan Flow Nodes',
        'Node Observable Coverage',
        'No Duplicate Focus Files',
        'Valid Focus Files',
        'Step Focus Target',
      ]);
      expect(checks.every((c) => c.passed)).toBe(true);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId: nonexistent} => returns error result', async () => {
      const proxy = QuestVerifyResponderProxy();
      proxy.setupEmptyFolder();

      const result = await proxy.callResponder({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });
});
