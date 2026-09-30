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
      const result = docsAnswerComposeTransformer({ scope: 'fixing' });

      expect(result.scopes.map((document) => document.scope)).toStrictEqual(['fixing']);
      expect(result.requested).toBe('fixing');
    });

    it('VALID: {scope: fixing} => the served document carries the start-nothing rule verbatim', () => {
      const result = docsAnswerComposeTransformer({ scope: 'fixing' });

      expect(result.scopes[0]?.sections[0]).toStrictEqual({
        heading: 'WHAT YOU WERE HANDED, AND WHAT THE FIRST FOUR READS COST',
        lines: [
          'You will receive a test record containing the instance ID, the run ID, the step that failed, the setup sequence, and paths to the saved evidence.',
          'Steps 1 through 4 below do not require a running instance. They only read files from disk. They are completely free and work perfectly even if the instance was shut down hours ago. When debugging manually, Step 5 reproduces on a fresh instance; an orchestrated fixer skips Step 5 entirely.',
          'Every data query on an instance you already named reports its status as alive, killed, dead, or pruned.',
          'A pruned status is an actual result, not empty data — if you query an old test and receive an empty list, you might incorrectly assume the test did nothing. Naming an id the registry never held is a different case: the tool refuses it outright, before touching any file, with exit code 1 and the message No record of the instance id "<id>". Check the id that `dungeonmaster siegelense start` returned. A typo in the id gets you this refusal, never a silent "unknown" result.',
        ],
      });
    });
  });

  describe('the preamble', () => {
    it('EMPTY: {scope: walking} => a role page carries no About block, so about is empty', () => {
      const result = docsAnswerComposeTransformer({ scope: 'walking' });

      expect(result.about).toStrictEqual([]);
    });

    it('EMPTY: {scope: fixing} => every role page carries no About block, not just walking', () => {
      const result = docsAnswerComposeTransformer({ scope: 'fixing' });

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
