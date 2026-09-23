import { docsAnswerContract } from './docs-answer-contract';
import { DocsAnswerStub } from './docs-answer.stub';

describe('docsAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {requested: null} => the whole-surface answer parses with its preamble and one document', () => {
      const answer = DocsAnswerStub();

      const result = docsAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        requested: null,
        about: ['siegelense stands up one instance of an app, drives it, and hands back READINGS.'],
        scopes: [
          {
            scope: 'walking',
            audience: 'the walker',
            summary: 'The verbs, the reading rules and the ladder.',
            sections: [
              {
                heading: 'THE LADDER',
                lines: [
                  'The rule: reach for the key first. dom is the hatch — last, and always narrow.',
                ],
              },
            ],
          },
        ],
      });
    });

    it('VALID: {requested: "fixing"} => a named scope parses, so a caller can tell one-asked-for from all', () => {
      const answer = DocsAnswerStub({ requested: 'fixing' });

      const result = docsAnswerContract.parse(answer);

      expect(result.requested).toBe('fixing');
    });

    it('EMPTY: {scopes: []} => an answer serving no document still parses', () => {
      const answer = DocsAnswerStub({ scopes: [] });

      const result = docsAnswerContract.parse(answer);

      expect(result.scopes).toStrictEqual([]);
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {extra key "count"} => throws Unrecognized key on the answer', () => {
      expect(() =>
        docsAnswerContract.parse({ requested: null, about: [], scopes: [], count: 7 } as never),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {section carrying an extra key} => throws Unrecognized key on the section', () => {
      expect(() =>
        docsAnswerContract.parse({
          requested: null,
          about: [],
          scopes: [
            {
              scope: 'walking',
              audience: 'the walker',
              summary: 'a summary',
              sections: [{ heading: 'THE LADDER', lines: [], rungs: 5 }],
            },
          ],
        } as never),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {requested: "reader"} => raises exactly one issue, scoped to requested', () => {
      const result = docsAnswerContract.safeParse({ requested: 'reader', about: [], scopes: [] });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_enum_value',
          options: ['planning', 'walking', 'attacking', 'fixing', 'driving'],
          path: ['requested'],
          received: 'reader',
          message:
            "Invalid enum value. Expected 'planning' | 'walking' | 'attacking' | 'fixing' | 'driving', received 'reader'",
        },
      ]);
    });
  });
});
