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
          'You will receive a test record containing the instance ID, the run ID, the step that failed, the setup sequence, and paths to the saved evidence.',
          'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. You only need to start a new instance for Step 5, when you actually reproduce the bug.',
          'Every data query will report the instance status as alive, killed, dead, pruned, or unknown.',
          'The statuses pruned and unknown are actual results, not just empty data. If you query an old test and receive an empty list, you might incorrectly assume the test did nothing. If you make a typo in the ID, the tool will return unknown, letting you know you made a mistake.',
        ],
      });
    });

    it('VALID: {scope: operating} => the served document names no step verb at all', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'operating' }) });
      const servedText = JSON.stringify(result.scopes).toLowerCase();

      expect(
        stepStatics.verbs.all.filter((verb) => new RegExp(`\\b${verb}\\b`, 'u').test(servedText)),
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
        'These instructions are provided via a command rather than being hardcoded into agent prompts for three reasons. First, any agent can fetch them dynamically. Second, there is only one central source of documentation to maintain. Third, system prompts have character limits; serving the manual dynamically saves valuable prompt space.',
      );
    });
  });
});
