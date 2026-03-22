import { AbsoluteFilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { wardDetailBroker } from './ward-detail-broker';
import { wardDetailBrokerProxy } from './ward-detail-broker.proxy';

describe('wardDetailBroker', () => {
  describe('successful detail retrieval', () => {
    it('VALID: {valid JSON output} => returns parsed output as ErrorMessage', async () => {
      const proxy = wardDetailBrokerProxy();
      const startPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = FileNameStub({ value: '1773805659495-6b06' });
      const jsonOutput = JSON.stringify({ checks: [], runId: '123' });

      proxy.setupSuccess({ output: jsonOutput });

      const result = await wardDetailBroker({ startPath, runId });

      expect(result).toBe(jsonOutput);
    });

    it('VALID: {output with whitespace} => returns trimmed JSON', async () => {
      const proxy = wardDetailBrokerProxy();
      const startPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = FileNameStub({ value: 'run-abc' });
      const jsonOutput = JSON.stringify({ checks: [{ checkType: 'lint' }] });

      proxy.setupSuccess({ output: `  ${jsonOutput}  \n` });

      const result = await wardDetailBroker({ startPath, runId });

      expect(result).toBe(jsonOutput);
    });
  });

  describe('failure cases', () => {
    it('ERROR: {non-zero exit code} => returns null', async () => {
      const proxy = wardDetailBrokerProxy();
      const startPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = FileNameStub({ value: 'run-fail' });

      proxy.setupFailure();

      const result = await wardDetailBroker({ startPath, runId });

      expect(result).toBeNull();
    });

    it('ERROR: {empty output} => returns null', async () => {
      const proxy = wardDetailBrokerProxy();
      const startPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = FileNameStub({ value: 'run-empty' });

      proxy.setupSuccess({ output: '' });

      const result = await wardDetailBroker({ startPath, runId });

      expect(result).toBeNull();
    });

    it('ERROR: {non-JSON output} => returns null', async () => {
      const proxy = wardDetailBrokerProxy();
      const startPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = FileNameStub({ value: 'run-bad' });

      proxy.setupSuccess({ output: 'not valid json' });

      const result = await wardDetailBroker({ startPath, runId });

      expect(result).toBeNull();
    });
  });
});
