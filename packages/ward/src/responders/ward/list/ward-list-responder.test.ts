import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { WardListResponderProxy } from './ward-list-responder.proxy';

describe('WardListResponder', () => {
  describe('no runId provided', () => {
    it('VALID: {args with no runId} => delegates to broker with rootPath only', async () => {
      const proxy = WardListResponderProxy();
      proxy.setupNoResult();

      await proxy.callResponder({
        args: ['node', 'ward', 'list'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual(['No ward results found\n']);
    });
  });

  describe('runId provided', () => {
    it('VALID: {args with runId} => delegates to broker with rootPath and parsed runId and writes result to stdout', async () => {
      const proxy = WardListResponderProxy();
      proxy.setupWithResult({ content: JSON.stringify(WardResultStub()) });

      await proxy.callResponder({
        args: ['node', 'ward', 'list', '1739625600000-a3f1'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStdoutCalls()).toStrictEqual(['\n']);
    });
  });

  describe('no result found', () => {
    it('VALID: {no result found} => writes "No ward results found" to stderr', async () => {
      const proxy = WardListResponderProxy();
      proxy.setupNoResult();

      await proxy.callResponder({
        args: ['node', 'ward', 'list'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getStderrCalls()).toStrictEqual(['No ward results found\n']);
    });
  });
});
