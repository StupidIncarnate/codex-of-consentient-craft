import { DocsScopeStub } from '../../contracts/docs-scope/docs-scope.stub';
import { docsStatics } from '../../statics/docs/docs-statics';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { stepStatics } from '../../statics/step/step-statics';

import { docsAnswerComposeTransformer } from './docs-answer-compose-transformer';

describe('docsAnswerComposeTransformer', () => {
  describe('the whole surface', () => {
    it('EMPTY: {scope: null} => serves every pinned scope, in the pinned order', () => {
      const result = docsAnswerComposeTransformer({ scope: null });

      expect(result.scopes.map((document) => document.scope)).toStrictEqual([
        ...siegelenseCallStatics.docs.scopes,
      ]);
    });

    it('EMPTY: {scope: null} => requested stays null, so a caller can tell all-by-default from all-by-request', () => {
      const result = docsAnswerComposeTransformer({ scope: null });

      expect(result.requested).toBe(null);
    });
  });

  describe('one scope', () => {
    it('VALID: {scope: fixing} => serves that document alone, with requested naming it', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'fixing' }) });

      expect(result.scopes.map((document) => document.scope)).toStrictEqual(['fixing']);
      expect(result.requested).toBe('fixing');
    });

    it('VALID: {scope: fixing} => the served document carries the start-nothing rule verbatim', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'fixing' }) });

      expect(result.scopes[0]?.sections[0]).toStrictEqual({
        heading: 'WHAT YOU WERE HANDED, AND WHAT THE FIRST FOUR READS COST',
        lines: [
          'Your record carries an instance id, a run id, a failing step, the prelude and the evidence paths.',
          'Steps 1 to 4 below start NOTHING. They read the asset tree and the registry, cost no boot and no pool slot, and answer exactly as well for an instance killed an hour ago as for one still running. The first thing that needs a live instance is step 5, which is the reproduction.',
          'Every answer carries instanceState: alive, killed, dead, pruned or unknown.',
          'pruned and unknown are REAL ANSWERS, not empty results. A query landing on reclaimed evidence that returned [] would read as "that step produced nothing", which is the one conclusion you must never draw from a missing file — and a mistyped id answering the same way sends you looking at the app instead of at your own record.',
        ],
      });
    });

    it('VALID: {scope: operating} => the served document names no step verb at all', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'operating' }) });
      const servedText = JSON.stringify(result.scopes).toLowerCase();

      expect(
        stepStatics.verbs.all.filter((verb) => servedText.includes(verb.toLowerCase())),
      ).toStrictEqual([]);
    });
  });

  describe('the preamble', () => {
    it('VALID: {scope: walking} => the about block is served whatever the scope', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'walking' }) });

      expect(result.about).toStrictEqual([...docsStatics.about]);
    });

    it('VALID: {scope: walking} => the about block names the 50,000-character ceiling this call routes around', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'walking' }) });

      expect(result.about[5]).toBe(
        'This is served by a call rather than pasted into a prompt for three reasons. Any session can fetch it, so "go drive the app with the siege tool" becomes a usable instruction to a session nobody orchestrated. There is one source to edit rather than one copy per role prompt. And a prompt has a hard ceiling: a served prompt over 50,000 characters is spilled to a file with an error stub handed back, and a full tool manual inside one spends that budget on something a call serves for free.',
      );
    });
  });
});
