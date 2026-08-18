import { getQaChecklistInputContract } from './get-qa-checklist-input-contract';
import { GetQaChecklistInputStub } from './get-qa-checklist-input.stub';

describe('getQaChecklistInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getQaChecklistInputContract.parse(GetQaChecklistInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });

    // The scoped form, and the only one a dispatched session should ever use: the operation item
    // carries the track, the flows and the package slice, and the server derives all three with the
    // same transformer the signal-back completion gate uses.
    it('VALID: {questId, operationItemId} => parses the item-scoped form', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({ questId: 'add-auth', operationItemId: 'op-1' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', operationItemId: 'op-1' });
    });

    it('VALID: {questId, flowId} => parses the un-scoped browse form', () => {
      expect(
        getQaChecklistInputContract.parse(
          GetQaChecklistInputStub({ questId: 'add-auth', flowId: 'login-flow' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', flowId: 'login-flow' });
    });
  });

  describe('the three scope arguments this input no longer takes', () => {
    // Each of these was a way to ask a DIFFERENT question from the one the completion gate answers,
    // and every one failed by over-reporting — the remainder simply never reached empty while
    // `done` went on being refused, with nothing naming the cause. They are gone, and `.strict()`
    // turns a stale call into a loud rejection instead of a silently ignored argument.
    it.each([
      ['track', { track: 'flowrider' }],
      ['packageNames', { packageNames: ['ui-app'] }],
      ['both', { track: 'groundstomper', packageNames: ['ui-app'] }],
    ])('INVALID: {%s} => rejected as an unrecognized key', (_name, extra) => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', ...extra } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {flowId: ""} => throws validation error', () => {
      expect(() => getQaChecklistInputContract.parse({ questId: 'add-auth', flowId: '' })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {operationItemId: ""} => throws validation error', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', operationItemId: '' }),
      ).toThrow(/too_small/u);
    });

    // A hard rejection rather than a precedence rule: the item already says which flows are in
    // scope, so a hand-picked flow alongside it can only mean the caller believes it is measuring
    // something the item does not cover, and letting either win silently is the whole failure mode
    // this input was rebuilt to remove.
    it('INVALID: {operationItemId AND flowId} => throws, the item already declares its flows', () => {
      expect(() =>
        getQaChecklistInputContract.parse({
          questId: 'add-auth',
          operationItemId: 'op-1',
          flowId: 'login-flow',
        }),
      ).toThrow(/flowId cannot be combined with operationItemId/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() =>
        getQaChecklistInputContract.parse({ questId: 'add-auth', stage: 'spec' } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
