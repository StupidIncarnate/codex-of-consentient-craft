import { DocsAnswerStub } from '../../contracts/docs-answer/docs-answer.stub';

import { docsAnswerRenderTransformer } from './docs-answer-render-transformer';

describe('docsAnswerRenderTransformer', () => {
  describe('one scope', () => {
    it('VALID: {one document, one section} => renders ABOUT, the scope headline, then the indented section', () => {
      const answer = DocsAnswerStub();

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'ABOUT\n' +
          '  siegelense stands up one instance of an app, drives it, and hands back READINGS.\n' +
          '\n' +
          'walking — the walker\n' +
          '  The verbs, the reading rules and the ladder.\n' +
          '\n' +
          '  THE LADDER\n' +
          '    The rule: reach for the key first. dom is the hatch — last, and always narrow.\n',
      );
    });
  });

  describe('two scopes', () => {
    it('VALID: {two documents} => each gets its own headline block, separated by a blank line', () => {
      const answer = DocsAnswerStub({
        about: ['Every call is: dungeonmaster siegelense <call>.'],
        scopes: [
          {
            scope: 'operating',
            audience: 'the operator',
            summary: 'Fleet management.',
            sections: [{ heading: 'REAPING RULES', lines: ['Run cleanup at both ends.'] }],
          },
          {
            scope: 'driving',
            audience: 'a session nobody orchestrated',
            summary: 'Everything is yours to do.',
            sections: [{ heading: 'THE SURFACE', lines: ['kill is yours to call.'] }],
          },
        ],
      });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'ABOUT\n' +
          '  Every call is: dungeonmaster siegelense <call>.\n' +
          '\n' +
          'operating — the operator\n' +
          '  Fleet management.\n' +
          '\n' +
          '  REAPING RULES\n' +
          '    Run cleanup at both ends.\n' +
          '\n' +
          'driving — a session nobody orchestrated\n' +
          '  Everything is yours to do.\n' +
          '\n' +
          '  THE SURFACE\n' +
          '    kill is yours to call.\n',
      );
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {scopes: [], about: []} => renders the bare ABOUT heading and one trailing newline', () => {
      const answer = DocsAnswerStub({ about: [], scopes: [] });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe('ABOUT\n');
    });

    it('EMPTY: {a section with no lines} => renders the heading alone, never a dangling indent', () => {
      const answer = DocsAnswerStub({
        about: [],
        scopes: [
          {
            scope: 'planning',
            audience: 'the planner',
            summary: 'Preludes and profiles.',
            sections: [{ heading: 'RECIPES', lines: [] }],
          },
        ],
      });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'ABOUT\n' +
          '\n' +
          'planning — the planner\n' +
          '  Preludes and profiles.\n' +
          '\n' +
          '  RECIPES\n',
      );
    });
  });
});
