import { dispatchStateContract } from './dispatch-state-contract';
import { DispatchStateStub } from './dispatch-state.stub';

describe('dispatchStateContract', () => {
  describe('valid input', () => {
    it('VALID: {mode: paused, updatedAt} => contract parses minimal shape', () => {
      const state = dispatchStateContract.parse({
        mode: 'paused',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      expect(state).toStrictEqual({
        mode: 'paused',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {default stub} => parses paused state without heartbeat', () => {
      const state = DispatchStateStub();

      expect(state).toStrictEqual({
        mode: 'paused',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {mode: node-playing, mcpHeartbeatAt} => parses playing state with heartbeat', () => {
      const state = DispatchStateStub({
        mode: 'node-playing',
        mcpHeartbeatAt: '2024-01-15T09:59:00.000Z',
      });

      expect(state).toStrictEqual({
        mode: 'node-playing',
        mcpHeartbeatAt: '2024-01-15T09:59:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {mode: "running"} => throws validation error', () => {
      expect(() => DispatchStateStub({ mode: 'running' as never })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {updatedAt: "not-a-date"} => throws validation error', () => {
      expect(() => DispatchStateStub({ updatedAt: 'not-a-date' as never })).toThrow(
        /Invalid datetime/u,
      );
    });

    it('INVALID: {mcpHeartbeatAt: "not-a-date"} => throws validation error', () => {
      expect(() => DispatchStateStub({ mcpHeartbeatAt: 'not-a-date' as never })).toThrow(
        /Invalid datetime/u,
      );
    });
  });
});
