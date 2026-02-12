import { OrchestrationStatusStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { processStatusBroker } from './process-status-broker';
import { processStatusBrokerProxy } from './process-status-broker.proxy';

describe('processStatusBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {processId} => returns orchestration status', async () => {
      const proxy = processStatusBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-12345' });
      const status = OrchestrationStatusStub({ processId: 'proc-12345', phase: 'codeweaver' });

      proxy.setupStatus({ status });

      const result = await processStatusBroker({ processId });

      expect(result).toStrictEqual(status);
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid processId} => throws error', async () => {
      const proxy = processStatusBrokerProxy();
      const processId = ProcessIdStub({ value: 'nonexistent' });

      proxy.setupError({ error: new Error('Process not found') });

      await expect(processStatusBroker({ processId })).rejects.toThrow('Process not found');
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = processStatusBrokerProxy();
      const processId = ProcessIdStub({ value: 'proc-12345' });

      proxy.setupInvalidResponse({ data: { bad: 'data' } });

      await expect(processStatusBroker({ processId })).rejects.toThrow(/invalid_type/u);
    });
  });
});
