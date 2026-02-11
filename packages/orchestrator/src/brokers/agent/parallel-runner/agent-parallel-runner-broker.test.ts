import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { MaxConcurrentStub } from '../../../contracts/max-concurrent/max-concurrent.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { WorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';
import { agentParallelRunnerBroker } from './agent-parallel-runner-broker';
import { agentParallelRunnerBrokerProxy } from './agent-parallel-runner-broker.proxy';

describe('agentParallelRunnerBroker', () => {
  describe('empty work units', () => {
    it('EMPTY: {workUnits: []} => returns empty array', async () => {
      agentParallelRunnerBrokerProxy();
      const maxConcurrent = MaxConcurrentStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single work unit', () => {
    it('VALID: {one work unit, spawn succeeds} => returns one result', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupAllSpawnsSucceed({ exitCode });
      const workUnit = WorkUnitStub();
      const maxConcurrent = MaxConcurrentStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [workUnit],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
      ]);
    });

    it('ERROR: {one work unit, spawn fails} => returns crashed result', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      proxy.setupSpawnFailure();
      const workUnit = WorkUnitStub();
      const maxConcurrent = MaxConcurrentStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [workUnit],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: true,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: null,
        },
      ]);
    });
  });

  describe('multiple work units within concurrency limit', () => {
    it('VALID: {2 work units, maxConcurrent: 3} => all run in single batch', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupAllSpawnsSucceed({ exitCode });
      const maxConcurrent = MaxConcurrentStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [WorkUnitStub(), WorkUnitStub()],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
      ]);
    });
  });

  describe('multiple work units exceeding concurrency limit', () => {
    it('VALID: {5 work units, maxConcurrent: 2} => runs in batches, returns all results', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupAllSpawnsSucceed({ exitCode });
      const maxConcurrent = MaxConcurrentStub({ value: 2 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [WorkUnitStub(), WorkUnitStub(), WorkUnitStub(), WorkUnitStub(), WorkUnitStub()],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
      ]);
    });
  });

  describe('mixed results', () => {
    it('VALID: {mixed results in batch} => returns results in order with mix of success and crashed', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupMixedOutcomes({ exitCode, leadingFailureCount: 1 });
      const maxConcurrent = MaxConcurrentStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [WorkUnitStub(), WorkUnitStub(), WorkUnitStub()],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: true,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: null,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
      ]);
    });
  });

  describe('all work units fail', () => {
    it('VALID: {all work units fail} => returns all crashed results', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      proxy.setupSpawnFailure();
      const maxConcurrent = MaxConcurrentStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [WorkUnitStub(), WorkUnitStub(), WorkUnitStub()],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: true,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: null,
        },
        {
          crashed: true,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: null,
        },
        {
          crashed: true,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: null,
        },
      ]);
    });
  });

  describe('sequential execution', () => {
    it('VALID: {3 work units, maxConcurrent: 1} => processes one at a time, returns all results', async () => {
      const proxy = agentParallelRunnerBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      proxy.setupAllSpawnsSucceed({ exitCode });
      const maxConcurrent = MaxConcurrentStub({ value: 1 });
      const timeoutMs = TimeoutMsStub({ value: 30000 });

      const result = await agentParallelRunnerBroker({
        workUnits: [WorkUnitStub(), WorkUnitStub(), WorkUnitStub()],
        maxConcurrent,
        timeoutMs,
      });

      expect(result).toStrictEqual([
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
        {
          crashed: false,
          timedOut: false,
          signal: null,
          sessionId: null,
          exitCode: 0,
        },
      ]);
    });
  });
});
