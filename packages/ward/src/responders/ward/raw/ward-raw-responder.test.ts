import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { WardRawResponderProxy } from './ward-raw-responder.proxy';

describe('WardRawResponder', () => {
  describe('missing runId and checkType', () => {
    it('ERROR: {args with no runId or checkType} => writes usage error to stderr', async () => {
      const proxy = WardRawResponderProxy();

      await proxy.callResponder({
        args: ['node', 'ward', 'raw'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual(['Usage: ward raw <run-id> <check-type>\n']);
    });
  });

  describe('has runId but missing checkType', () => {
    it('ERROR: {args with runId but no checkType} => writes usage error to stderr', async () => {
      const proxy = WardRawResponderProxy();

      await proxy.callResponder({
        args: ['node', 'ward', 'raw', '1739625600000-a3f1'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual(['Usage: ward raw <run-id> <check-type>\n']);
    });
  });

  describe('has runId and checkType', () => {
    it('VALID: {args with runId and checkType} => delegates to broker with parsed values', async () => {
      const proxy = WardRawResponderProxy();
      proxy.setupWithResult({ content: JSON.stringify(WardResultStub()) });

      await proxy.callResponder({
        args: ['node', 'ward', 'raw', '1739625600000-a3f1', 'lint'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'No lint check found in run 1739625600000-a3f1\n',
      ]);
    });
  });
});
