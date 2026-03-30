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
      });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {stub} => parses successfully', () => {
      const stub = AgentSpawnStreamingResultStub();

      expect(stub).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {nullable sessionId} => parses successfully', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        crashed: false,
      });

      expect(result.sessionId).toBe(null);
    });

    it('VALID: {nullable exitCode} => parses successfully', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: SessionIdStub(),
        exitCode: null,
        signal: null,
        crashed: false,
      });

      expect(result.exitCode).toBe(null);
    });

    it('VALID: {capturedOutput omitted} => defaults to empty array', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        crashed: false,
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
        }),
      ).toThrow(/Required/u);
    });
  });
});
