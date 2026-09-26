import { AbsoluteFilePathStub, AdapterResultStub } from '@dungeonmaster/shared/contracts';

import { WardDedupeResponder } from './ward-dedupe-responder';
import { WardDedupeResponderProxy } from './ward-dedupe-responder.proxy';

describe('WardDedupeResponder', () => {
  describe('valid inputs', () => {
    it('VALID: {rootPath} => delegates to the command broker and returns success', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const proxy = WardDedupeResponderProxy();
      proxy.setupRun({ rootPath, result: AdapterResultStub() });

      const result = await WardDedupeResponder({ args: ['node', 'ward', 'dedupe'], rootPath });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
