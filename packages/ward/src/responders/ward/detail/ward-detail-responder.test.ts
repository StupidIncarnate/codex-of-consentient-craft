import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { WardDetailResponderProxy } from './ward-detail-responder.proxy';

describe('WardDetailResponder', () => {
  describe('missing runId and filePath', () => {
    it('ERROR: {args with no runId or filePath} => writes usage error to stderr', async () => {
      const proxy = WardDetailResponderProxy();

      await proxy.callResponder({
        args: ['node', 'ward', 'detail'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual(['Usage: ward detail <run-id> <file-path>\n']);
    });
  });

  describe('has runId but missing filePath', () => {
    it('ERROR: {args with runId but no filePath} => writes usage error to stderr', async () => {
      const proxy = WardDetailResponderProxy();

      await proxy.callResponder({
        args: ['node', 'ward', 'detail', '1739625600000-a3f1'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual(['Usage: ward detail <run-id> <file-path>\n']);
    });
  });

  describe('has runId and filePath', () => {
    it('VALID: {args with runId and filePath} => delegates to broker and writes detail to stdout', async () => {
      const proxy = WardDetailResponderProxy();
      proxy.setupWithResult({ content: JSON.stringify(WardResultStub()) });

      await proxy.callResponder({
        args: ['node', 'ward', 'detail', '1739625600000-a3f1', 'src/index.ts'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStdoutCalls()).toStrictEqual(['src/index.ts\n']);
    });
  });
});
