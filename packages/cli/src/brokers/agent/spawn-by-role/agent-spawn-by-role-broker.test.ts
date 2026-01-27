import {
  DependencyStepStub,
  ExitCodeStub,
  QuestIdStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBroker } from './agent-spawn-by-role-broker';
import { agentSpawnByRoleBrokerProxy } from './agent-spawn-by-role-broker.proxy';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { FileWorkUnitStub } from '../../../contracts/file-work-unit/file-work-unit.stub';
import { FilePairWorkUnitStub } from '../../../contracts/file-pair-work-unit/file-pair-work-unit.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('agentSpawnByRoleBroker', () => {
  describe('pathseeker role', () => {
    it('VALID: {role: pathseeker, questId} => routes to pathseeker spawn streaming broker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupPathseekerSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'pathseeker', questId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {role: pathseeker, with resumeSessionId} => passes resume to pathseeker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupPathseekerSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'pathseeker', questId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        resumeSessionId,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('codeweaver role', () => {
    it('VALID: {role: codeweaver, step} => routes to codeweaver spawn streaming broker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub({ name: 'Create user API endpoint' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupCodeweaverSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'codeweaver', step },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {role: codeweaver, with resumeSessionId} => passes resume to codeweaver', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub({ name: 'Create user API endpoint' });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-456' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupCodeweaverSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'codeweaver', step },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        resumeSessionId,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('spiritmender role', () => {
    it('VALID: {role: spiritmender, file, stepId} => routes to spiritmender spawn streaming broker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const file = FileWorkUnitStub({
        filePath: '/home/user/project/src/broker.ts' as never,
        errors: ['Missing return type'] as never,
      });
      const stepId = StepIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupSpiritmenderSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'spiritmender', file, stepId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {role: spiritmender, with resumeSessionId} => passes resume to spiritmender', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const file = FileWorkUnitStub();
      const stepId = StepIdStub();
      const resumeSessionId = SessionIdStub({ value: 'resume-session-789' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupSpiritmenderSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'spiritmender', file, stepId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        resumeSessionId,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {role: lawbringer, filePair, stepId} => routes to lawbringer spawn streaming broker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const filePair = FilePairWorkUnitStub();
      const stepId = StepIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupLawbringerSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'lawbringer', filePair, stepId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {role: lawbringer, with resumeSessionId} => passes resume to lawbringer', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const filePair = FilePairWorkUnitStub();
      const stepId = StepIdStub();
      const resumeSessionId = SessionIdStub({ value: 'resume-session-abc' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupLawbringerSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'lawbringer', filePair, stepId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        resumeSessionId,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('siegemaster role', () => {
    it('VALID: {role: siegemaster, questId, stepId} => routes to siegemaster spawn streaming broker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const stepId = StepIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupSiegemasterSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'siegemaster', questId, stepId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {role: siegemaster, with resumeSessionId} => passes resume to siegemaster', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const stepId = StepIdStub();
      const resumeSessionId = SessionIdStub({ value: 'resume-session-def' });
      const exitCode = ExitCodeStub({ value: 0 });
      const expectedResult = AgentSpawnStreamingResultStub({
        sessionId: null,
        exitCode,
        signal: null,
        crashed: false as never,
        timedOut: false as never,
      });

      proxy.setupSiegemasterSuccess({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'siegemaster', questId, stepId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        resumeSessionId,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error handling', () => {
    it('ERROR: {pathseeker crashes} => returns crashed true', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const exitCode = ExitCodeStub({ value: 1 });

      proxy.setupPathseekerCrash({ exitCode });

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'pathseeker', questId },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: true as never,
          timedOut: false as never,
        }),
      );
    });

    it('ERROR: {codeweaver times out} => returns timedOut true', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();

      proxy.setupCodeweaverTimeout();

      const result = await agentSpawnByRoleBroker({
        workUnit: { role: 'codeweaver', step },
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode: null,
          signal: null,
          crashed: false as never,
          timedOut: true as never,
        }),
      );
    });

    it('ERROR: {spiritmender spawn fails} => rejects with error', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const file = FileWorkUnitStub();
      const stepId = StepIdStub();
      const error = new Error('ENOENT: claude command not found');

      proxy.setupSpiritmenderError({ error });

      await expect(
        agentSpawnByRoleBroker({
          workUnit: { role: 'spiritmender', file, stepId },
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow(/ENOENT: claude command not found/u);
    });
  });
});
