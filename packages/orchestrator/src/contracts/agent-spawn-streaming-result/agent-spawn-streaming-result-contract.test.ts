import { ExitCodeStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { StreamTextStub } from '../stream-text/stream-text.stub';
import { AgentSpawnStreamingResultStub } from './agent-spawn-streaming-result.stub';
import { agentSpawnStreamingResultContract } from './agent-spawn-streaming-result-contract';

describe('agentSpawnStreamingResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        crashed: false,
        timedOut: false,
      });

      expect(result.crashed).toBe(false);
      expect(result.timedOut).toBe(false);
      expect(result.capturedOutput).toStrictEqual([]);
    });

    it('VALID: {stub} => parses successfully', () => {
      const stub = AgentSpawnStreamingResultStub();

      expect(stub.crashed).toBe(false);
      expect(stub.timedOut).toBe(false);
      expect(stub.signal).toBeNull();
      expect(stub.capturedOutput).toStrictEqual([]);
    });

    it('VALID: {nullable sessionId} => parses successfully', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        crashed: false,
        timedOut: false,
      });

      expect(result.sessionId).toBeNull();
    });

    it('VALID: {nullable exitCode} => parses successfully', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: SessionIdStub(),
        exitCode: null,
        signal: null,
        crashed: false,
        timedOut: true,
      });

      expect(result.exitCode).toBeNull();
      expect(result.timedOut).toBe(true);
    });

    it('VALID: {capturedOutput omitted} => defaults to empty array', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        crashed: false,
        timedOut: false,
      });

      expect(result.capturedOutput).toStrictEqual([]);
    });

    it('VALID: {capturedOutput with text lines} => parses successfully', () => {
      const line1 = StreamTextStub({ value: 'Hello from agent' });
      const line2 = StreamTextStub({ value: 'Work in progress' });

      const result = agentSpawnStreamingResultContract.parse({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [line1, line2],
      });

      expect(result.capturedOutput).toStrictEqual(['Hello from agent', 'Work in progress']);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing crashed} => throws error', () => {
      expect(() =>
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
          timedOut: false,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing timedOut} => throws error', () => {
      expect(() =>
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
          crashed: false,
        }),
      ).toThrow(/Required/u);
    });
  });
});
