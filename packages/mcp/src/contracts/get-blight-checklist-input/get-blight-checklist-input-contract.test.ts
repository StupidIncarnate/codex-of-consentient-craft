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

    // THE REVIEWER-MINION'S SCOPE. No worker commits anything, so a whole round sits uncommitted
    // until its reviewer commits it once at the end — and this is the only scope that sees it, the
    // only one that unions in untracked files, and the only one needing no review base.
    it("VALID: {questId, scope: 'working-tree'} => parses, so a reviewer can scope to its uncommitted round", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'working-tree' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'working-tree' });
    });

    // NO LONGER the reviewer's scope. Before that session commits, `@{upstream}..HEAD` holds the
    // planner's commit of the round document and nothing else. It stays parseable for a caller whose
    // subject really is published-or-not.
    it("VALID: {questId, scope: 'unpushed'} => parses, so a caller measuring unpublished commits can ask", () => {
      expect(
        getBlightChecklistInputContract.parse(
          GetBlightChecklistInputStub({ questId: 'add-auth', scope: 'unpushed' }),
        ),
      ).toStrictEqual({ questId: 'add-auth', scope: 'unpushed' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({ questId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => getBlightChecklistInputContract.parse({})).toThrow(/Required/u);
    });

    it("INVALID: {scope: 'branch'} => throws, the only four diffs are the quest's, the last commit's, the unpushed round's, and the working tree's", () => {
      expect(() =>
        getBlightChecklistInputContract.parse({ questId: 'add-auth', scope: 'branch' } as never),
      ).toThrow(/Invalid enum value/u);
    });

    // `since-ref` is deliberately server-side only: its single caller is the signal-back
    // review-coverage gate, which names a work item's recorded `startRef`. Exposing it here would
    // offer an agent a base no agent has any way to compute.
    it("INVALID: {scope: 'since-ref'} => throws, that scope is not part of the agent-facing surface", () => {
      expect(() =>
        getBlightChecklistInputContract.parse({ questId: 'add-auth', scope: 'since-ref' } as never),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {planId} => throws Unrecognized key, because no scope takes an id argument', () => {
      expect(() =>
        getBlightChecklistInputContract.parse({
          questId: 'add-auth',
          scope: 'unpushed',
          planId: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
        } as never),
      ).toThrow(/Unrecognized key/u);
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
