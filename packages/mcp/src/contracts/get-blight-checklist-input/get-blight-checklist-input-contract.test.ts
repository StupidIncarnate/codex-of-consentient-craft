import { getBlightChecklistInputContract } from './get-blight-checklist-input-contract';
import { GetBlightChecklistInputStub } from './get-blight-checklist-input.stub';

describe('getBlightChecklistInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      expect(getBlightChecklistInputContract.parse(GetBlightChecklistInputStub())).toStrictEqual({
        questId: 'add-auth',
      });
    });

    // A caller auditing one landed commit passes this rather than the whole-quest default. A schema
    // that rejected it would leave that caller reading a diff it was not asking about.
    it("VALID: {questId, scope: 'commit'} => parses, so a one-commit audit call is accepted", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'commit' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'commit' });
    });

    it("VALID: {questId, scope: 'quest'} => parses the whole-diff scope explicitly", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'quest' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'quest' });
    });

    // A reviewer sub-agent runs BEFORE its parent session commits, so nothing under review is in
    // history yet — 'commit' would hand it the round BEFORE its own. This is the one scope that
    // needs no pinned baseRef and reads uncommitted + untracked changes alone.
    it("VALID: {questId, scope: 'working-tree'} => parses, so a pre-commit reviewer can scope to uncommitted changes", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'working-tree' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'working-tree' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it("INVALID: {scope: 'branch'} => throws, the only three diffs are the quest's, the last commit's, and the working tree's", () => {
      expect(() =>
        getBlightChecklistInputContract.parse({ questId: 'add-auth', scope: 'branch' } as never),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error, no flowId sub-scope exists', () => {
      expect(() =>
        getBlightChecklistInputContract.parse({
          questId: 'add-auth',
          flowId: 'login-flow',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
