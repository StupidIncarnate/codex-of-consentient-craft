import { DocsScopeStub } from '../../contracts/docs-scope/docs-scope.stub';
import { docsStatics } from '../../statics/docs/docs-statics';

import { docsAnswerComposeTransformer } from './docs-answer-compose-transformer';

describe('docsAnswerComposeTransformer', () => {
  describe('the bare call — about alone', () => {
    it('EMPTY: {scope: null} => serves no scope documents at all', () => {
      const result = docsAnswerComposeTransformer({ scope: null });

      expect(result.scopes).toStrictEqual([]);
    });

    it('EMPTY: {scope: null} => requested stays null, so a caller can tell the overview from a real request', () => {
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
  });

  describe('the preamble', () => {
    it('EMPTY: {scope: walking} => a role page carries no About block, so about is empty', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'walking' }) });

      expect(result.about).toStrictEqual([]);
    });

    it('EMPTY: {scope: fixing} => every role page carries no About block, not just walking', () => {
      const result = docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'fixing' }) });

      expect(result.about).toStrictEqual([]);
    });

    it('VALID: {scope: null} => the bare call still serves the about overview in full', () => {
      const result = docsAnswerComposeTransformer({ scope: null });

      expect(result.about).toStrictEqual([...docsStatics.about]);
    });

    it('VALID: {scope: null} => the about block names the 50,000-character ceiling this call routes around', () => {
      const result = docsAnswerComposeTransformer({ scope: null });

      expect(result.about[5]).toBe(
        'These instructions are provided via a command rather than being hardcoded into agent prompts for three reasons. First, any agent can fetch them dynamically. Second, there is only one central source of documentation to maintain. Third, system prompts have character limits; serving the manual dynamically saves valuable prompt space.',
      );
    });
  });
});
