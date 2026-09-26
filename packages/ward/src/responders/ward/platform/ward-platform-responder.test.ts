import { AbsoluteFilePathStub, AdapterResultStub } from '@dungeonmaster/shared/contracts';

import { WardPlatformResponder } from './ward-platform-responder';
import { WardPlatformResponderProxy } from './ward-platform-responder.proxy';

describe('WardPlatformResponder', () => {
  describe('valid inputs', () => {
    it('VALID: {rootPath} => delegates to the command broker and returns success', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const proxy = WardPlatformResponderProxy();
      proxy.setupRun({ rootPath, result: AdapterResultStub() });

      const result = await WardPlatformResponder({ args: ['node', 'ward', 'platform'], rootPath });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
