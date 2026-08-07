import { resetFlowSignoffsResultContract } from './reset-flow-signoffs-result-contract';
import { ResetFlowSignoffsResultStub } from './reset-flow-signoffs-result.stub';

describe('resetFlowSignoffsResultContract', () => {
  describe('valid results', () => {
    it('VALID: {clearedCount: 12, noteId} => parses successfully', () => {
      expect(ResetFlowSignoffsResultStub()).toStrictEqual({
        clearedCount: 12,
        noteId: 'walk-reset-login-flow-1',
      });
    });

    it('EDGE: {clearedCount: 0} => parses, because a flow with nothing signed is a real reset', () => {
      expect(ResetFlowSignoffsResultStub({ clearedCount: 0 as never })).toStrictEqual({
        clearedCount: 0,
        noteId: 'walk-reset-login-flow-1',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {clearedCount: -1} => throws, a reset cannot clear a negative number of units', () => {
      expect(() =>
        resetFlowSignoffsResultContract.parse({
          clearedCount: -1,
          noteId: 'walk-reset-login-flow-1',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {clearedCount: 1.5} => throws, unit counts are whole', () => {
      expect(() =>
        resetFlowSignoffsResultContract.parse({
          clearedCount: 1.5,
          noteId: 'walk-reset-login-flow-1',
        }),
      ).toThrow(/Expected integer/u);
    });

    it('INVALID: {noteId: ""} => throws, the appended note must be addressable', () => {
      expect(() => resetFlowSignoffsResultContract.parse({ clearedCount: 1, noteId: '' })).toThrow(
        /too_small/u,
      );
    });
  });
});
