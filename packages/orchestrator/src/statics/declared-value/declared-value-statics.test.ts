import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { declaredValueStatics } from './declared-value-statics';

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Anything measuring the real bytes reads `declaredValueStatics.markdown`
// directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_MARKDOWN = declaredValueStatics.markdown.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_MARKDOWN.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('declaredValueStatics', () => {
  it('VALID: exported value => is exactly one markdown block and nothing else', () => {
    expect(declaredValueStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  // Every prompt that authors, reviews or meets an observable interpolates this whole block, so it
  // is measured once more by each of those prompts' own colocated tests. This test measures the
  // block itself, on its own.
  it('VALID: markdown => stays under the MCP tool-result verbatim-delivery ceiling on its own', () => {
    const bytes = Buffer.byteLength(declaredValueStatics.markdown, 'utf8');

    expect(bytes).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // The two entries that carry the whole point of one list: a raw colour and a margin. Drop either
  // and the authoring role — the only role that can set the flag — stops flagging a value every
  // downstream session then has to write a change-detector for.
  describe('the enumeration', () => {
    it('VALID: markdown => names every kind of declared value in one sentence', () => {
      expect({
        wholeList: has(
          'A font size, a colour or a colour token, a class name, a typeface, a border, a padding or a margin, an animation duration, or a "matching `<some other component>`" claim.',
        ),
        rawColourAsWellAsToken: has('a colour or a colour token'),
        marginAsWellAsPadding: has('a padding or a margin'),
        whyTheAssertionIsWorthless: has(
          'The assertion for every one of those reaches the value and reads back the literal the source declares: green the day it is written, red on the next restyle, blind to every defect in between.',
        ),
      }).toStrictEqual({
        wholeList: true,
        rawColourAsWellAsToken: true,
        marginAsWellAsPadding: true,
        whyTheAssertionIsWorthless: true,
      });
    });
  });

  describe('the painted outcome on the other side of the line', () => {
    it('VALID: markdown => keeps a perceived outcome a test, and gives the question that separates the two', () => {
      expect({
        paintedOutcomeStaysATest: has(
          '**A PAINTED OUTCOME is the opposite, and it stays a test.**',
        ),
        theFourPaintedShapes: has(
          'A label clipped at 400px, two controls overlapping, a control off-screen, text unreadable against its background — the source states none of those, so a real browser is the only place they are true or false.',
        ),
        theSeparatingQuestion: has(
          '**The question that separates the two: could this break with no user-visible change?** Yes means it is a declared value.',
        ),
      }).toStrictEqual({
        paintedOutcomeStaysATest: true,
        theFourPaintedShapes: true,
        theSeparatingQuestion: true,
      });
    });
  });

  describe('what an unflagged declared value costs', () => {
    it('VALID: markdown => names the flag, its one author, and what a session meeting an unflagged one does', () => {
      expect({
        flagAndItsOnlyAuthor: has(
          '**A declared value carries `verifyByReading: true`, and only the authoring role can set it.**',
        ),
        nothingDownstreamCanRefuseIt: has(
          'Nothing downstream can refuse an observable that arrives unflagged: no track holds a verdict meaning "this should not have a test", so a session that meets one writes the change-detector instead.',
        ),
      }).toStrictEqual({
        flagAndItsOnlyAuthor: true,
        nothingDownstreamCanRefuseIt: true,
      });
    });
  });

  // A shared block is a contract on every prompt that takes it. Authoring the flag, warning about a
  // missing one and meeting one on a walk are three different jobs, and each belongs in the prompt
  // of the reader that holds it.
  describe('what a block read by author, reviewer and walker alike must never name', () => {
    it('VALID: markdown => tells no single reader what to do about what it classifies', () => {
      expect({
        suggestTheFlag: has('Suggest the flag'),
        flagAsAWarning: has('Flag as a **Warning**'),
        codeweaver: has('Codeweaver'),
        flowrider: has('Flowrider'),
        siegemaster: has('Siegemaster'),
      }).toStrictEqual({
        suggestTheFlag: false,
        flagAsAWarning: false,
        codeweaver: false,
        flowrider: false,
        siegemaster: false,
      });
    });
  });
});
