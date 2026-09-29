import { DispatchHoldStub } from '../dispatch-hold/dispatch-hold.stub';

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

    it('VALID: {default stub} => parses paused state', () => {
      const state = DispatchStateStub();

      expect(state).toStrictEqual({
        mode: 'paused',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {mode: node-playing} => parses playing state', () => {
      const state = DispatchStateStub({ mode: 'node-playing' });

      expect(state).toStrictEqual({
        mode: 'node-playing',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {mode: node-playing, hold} => keeps the user mode alongside the guardrail veto', () => {
      const state = DispatchStateStub({
        mode: 'node-playing',
        hold: DispatchHoldStub(),
      });

      expect(state).toStrictEqual({
        mode: 'node-playing',
        hold: {
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 93%',
          heldAt: '2026-09-13T04:49:29.242Z',
          resumeAt: '2026-09-13T06:00:00.000Z',
        },
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('EMPTY: {hold: null} => parses an explicitly cleared hold, which is how an expiry is written', () => {
      const state = DispatchStateStub({ mode: 'node-playing', hold: null });

      expect(state).toStrictEqual({
        mode: 'node-playing',
        hold: null,
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {mode: "running"} => throws validation error', () => {
      expect(() => DispatchStateStub({ mode: 'running' })).toThrow(/Invalid option/u);
    });

    it('INVALID: {updatedAt: "not-a-date"} => throws validation error', () => {
      expect(() => DispatchStateStub({ updatedAt: 'not-a-date' })).toThrow(/Invalid ISO datetime/u);
    });
  });
});
