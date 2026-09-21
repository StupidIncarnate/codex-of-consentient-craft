import { runStepContract } from './run-step-contract';
import { RunStepStub } from './run-step.stub';

describe('runStepContract', () => {
  describe('a deterministic step the dispatcher can run', () => {
    it('VALID: {a commit step declaring no args} => parses whole, with an empty arg list', () => {
      expect(
        runStepContract.parse(
          RunStepStub({
            questId: 'add-auth',
            workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            handler: 'commit',
            args: [],
          }),
        ),
      ).toStrictEqual({
        type: 'run-step',
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        handler: 'commit',
        args: [],
      });
    });

    it('VALID: {a ward step declaring its two args} => keeps them in the order the graph declares', () => {
      expect(
        RunStepStub({ handler: 'ward', args: ['--committed', '--uncommitted'] }).args,
      ).toStrictEqual(['--committed', '--uncommitted']);
    });
  });

  describe('a handler name naming no code', () => {
    it('INVALID: {handler: "spiritmender"} => throws, because the handler set is closed', () => {
      expect(() => RunStepStub({ handler: 'spiritmender' as never })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
