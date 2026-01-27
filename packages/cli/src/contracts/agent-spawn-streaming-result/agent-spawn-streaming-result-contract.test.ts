import { agentSpawnStreamingResultContract } from './agent-spawn-streaming-result-contract';
import { AgentSpawnStreamingResultStub } from './agent-spawn-streaming-result.stub';
import { SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

describe('agentSpawnStreamingResultContract', () => {
  describe('valid results', () => {
    it('VALID: {sessionId, exitCode, signal: null, crashed: false, timedOut: false} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const exitCode = ExitCodeStub({ value: 0 });

      const result = agentSpawnStreamingResultContract.parse({
        sessionId,
        exitCode,
        signal: null,
        crashed: false,
        timedOut: false,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode,
        signal: null,
        crashed: false,
        timedOut: false,
      });
    });

    it('VALID: {sessionId: null, exitCode: null} => parses with null values', () => {
      const result = agentSpawnStreamingResultContract.parse({
        sessionId: null,
        exitCode: null,
        signal: null,
        crashed: true,
        timedOut: false,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        signal: null,
        crashed: true,
        timedOut: false,
      });
    });

    it('VALID: {with signal} => parses with signal object', () => {
      const sessionId = SessionIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const signal = StreamSignalStub();

      const result = agentSpawnStreamingResultContract.parse({
        sessionId,
        exitCode,
        signal,
        crashed: false,
        timedOut: false,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode,
        signal,
        crashed: false,
        timedOut: false,
      });
    });

    it('VALID: {timedOut: true} => parses timeout result', () => {
      const sessionId = SessionIdStub();

      const result = agentSpawnStreamingResultContract.parse({
        sessionId,
        exitCode: null,
        signal: null,
        crashed: false,
        timedOut: true,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode: null,
        signal: null,
        crashed: false,
        timedOut: true,
      });
    });

    it('VALID: {stub default} => creates valid result', () => {
      const sessionId = SessionIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const stub = AgentSpawnStreamingResultStub({ sessionId, exitCode });

      const result = agentSpawnStreamingResultContract.parse(stub);

      expect(result).toStrictEqual({
        sessionId,
        exitCode,
        signal: null,
        crashed: false,
        timedOut: false,
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_CRASHED: {crashed: "true"} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
          crashed: 'true',
          timedOut: false,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_TIMED_OUT: {timedOut: 1} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
          crashed: false,
          timedOut: 1,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_MULTIPLE: {missing crashed and timedOut} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_SESSION_ID: {sessionId: ""} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: '' as never,
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
          crashed: false,
          timedOut: false,
        });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID_EXIT_CODE: {exitCode: -1} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: -1 as never,
          signal: null,
          crashed: false,
          timedOut: false,
        });
      }).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID_EXIT_CODE: {exitCode: 256} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: 256 as never,
          signal: null,
          crashed: false,
          timedOut: false,
        });
      }).toThrow(/less than or equal to 255/u);
    });

    it('INVALID_EXIT_CODE: {exitCode: 1.5} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: 1.5 as never,
          signal: null,
          crashed: false,
          timedOut: false,
        });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID_SIGNAL: {signal: {}} => throws validation error', () => {
      expect(() => {
        agentSpawnStreamingResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: {} as never,
          crashed: false,
          timedOut: false,
        });
      }).toThrow(/Required/u);
    });
  });
});
