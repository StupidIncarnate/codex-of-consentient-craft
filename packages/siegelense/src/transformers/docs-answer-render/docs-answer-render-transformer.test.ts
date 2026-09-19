import { DocsAnswerStub } from '../../contracts/docs-answer/docs-answer.stub';

import { docsAnswerRenderTransformer } from './docs-answer-render-transformer';

describe('docsAnswerRenderTransformer', () => {
  describe('one scope', () => {
    it('VALID: {one document, one section} => renders title, ABOUT, the scope headline, then the section', () => {
      const answer = DocsAnswerStub();

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '# Siegelense Documentation\n' +
          '\n' +
          '## About\n' +
          '\n' +
          '- siegelense stands up one instance of an app, drives it, and hands back READINGS.\n' +
          '\n' +
          '## walking — the walker\n' +
          '\n' +
          'The verbs, the reading rules and the ladder.\n' +
          '\n' +
          '### THE LADDER\n' +
          '\n' +
          '- The rule: reach for the key first. dom is the hatch — last, and always narrow.\n',
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
        '# Siegelense Documentation\n' +
          '\n' +
          '## About\n' +
          '\n' +
          '- Every call is: dungeonmaster siegelense <call>.\n' +
          '\n' +
          '## operating — the operator\n' +
          '\n' +
          'Fleet management.\n' +
          '\n' +
          '### REAPING RULES\n' +
          '\n' +
          '- Run cleanup at both ends.\n' +
          '\n' +
          '## driving — a session nobody orchestrated\n' +
          '\n' +
          'Everything is yours to do.\n' +
          '\n' +
          '### THE SURFACE\n' +
          '\n' +
          '- kill is yours to call.\n',
      );
    });
  });

  describe('formatting', () => {
    it('VALID: {step definition} => renders as fenced json block', () => {
      const answer = DocsAnswerStub({
        about: [],
        scopes: [
          {
            scope: 'walking',
            audience: 'the walker',
            summary: 'Summary',
            sections: [
              {
                heading: 'VERBS',
                lines: ["{ step: 'goto', path: '/' }"],
              },
            ],
          },
        ],
      });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '# Siegelense Documentation\n' +
          '\n' +
          '## walking — the walker\n' +
          '\n' +
          'Summary\n' +
          '\n' +
          '### VERBS\n' +
          '\n' +
          '```json\n' +
          "{ step: 'goto', path: '/' }\n" +
          '```\n',
      );
    });

    it('VALID: {cli command} => renders as fenced bash block', () => {
      const answer = DocsAnswerStub({
        about: [],
        scopes: [
          {
            scope: 'fixing',
            audience: 'the fixer',
            summary: 'Summary',
            sections: [
              {
                heading: 'COMMANDS',
                lines: ['dungeonmaster siegelense status --instance <id>'],
              },
            ],
          },
        ],
      });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '# Siegelense Documentation\n' +
          '\n' +
          '## fixing — the fixer\n' +
          '\n' +
          'Summary\n' +
          '\n' +
          '### COMMANDS\n' +
          '\n' +
          '```bash\n' +
          'dungeonmaster siegelense status --instance <id>\n' +
          '```\n',
      );
    });

    it('VALID: {term with em-dash} => bolds the prefix term', () => {
      const answer = DocsAnswerStub({
        about: [],
        scopes: [
          {
            scope: 'operating',
            audience: 'the operator',
            summary: 'Summary',
            sections: [
              {
                heading: 'CAPACITY',
                lines: [
                  'dungeonmaster siegelense capacity — what this machine can take right now.',
                ],
              },
            ],
          },
        ],
      });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '# Siegelense Documentation\n' +
          '\n' +
          '## operating — the operator\n' +
          '\n' +
          'Summary\n' +
          '\n' +
          '### CAPACITY\n' +
          '\n' +
          '- **dungeonmaster siegelense capacity** — what this machine can take right now.\n',
      );
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {scopes: [], about: []} => renders the bare title and one trailing newline', () => {
      const answer = DocsAnswerStub({ about: [], scopes: [] });

      const result = docsAnswerRenderTransformer({ answer });

      expect(result).toBe('# Siegelense Documentation\n');
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
        '# Siegelense Documentation\n' +
          '\n' +
          '## planning — the planner\n' +
          '\n' +
          'Preludes and profiles.\n' +
          '\n' +
          '### RECIPES\n',
      );
    });
  });
});
