import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { RefStub } from '../../../contracts/ref/ref.stub';
import { playwrightSessionAdapter } from './playwright-session-adapter';

const EVIDENCE_PATH = AbsoluteFilePathStub({ value: '/tmp/siegelense-integration' });
const BASE_URL = 'http://localhost';
const BROWSER_TIMEOUT_MS = 90_000;
const CLICK_TIMEOUT_MS = 10_000;

// The exact shape `scrolls/seigelense/HANDOFF.md` lines 206-214 records as the dead end: two
// elements sharing `data-testid="PIXEL_BTN"` AND sharing a `within` of `MAP_FRAME`, so the advice
// the ambiguity error gives — narrow with `within` — cannot be followed. Written with no whitespace
// between tags, so a container's own text nodes are genuinely empty rather than incidentally so.
const AMBIGUOUS_PAGE = [
  '<!doctype html><html><head><style>.pixel{padding:4px}</style></head><body>',
  '<div data-testid="MAP_FRAME"><div class="wrapper-that-should-collapse">',
  '<button data-testid="PIXEL_BTN" onclick="document.getElementById(\'out\').textContent=\'BROWSE\'">BROWSE</button>',
  '<button data-testid="PIXEL_BTN" onclick="document.getElementById(\'out\').textContent=\'CREATE\'">CREATE</button>',
  '</div></div>',
  '<div data-testid="RESULT" id="out">none</div>',
  '<div data-testid="OWN_TEXT_PARENT">own words<style>.hidden{display:none}</style>',
  '<span data-testid="NESTED_CHILD">nested words</span></div>',
  '</body></html>',
].join('');

const SECOND_PAGE =
  '<!doctype html><html><body><div data-testid="OTHER_SCREEN">a different screen</div></body></html>';

// The four column-and-flag defects a real drive against this app's own home screen surfaced: a
// button reporting a bare empty `value`, a per-mount DOM id in the element column, `not-tabbable`
// firing on every sprite inside one link, and `empty` firing on an input.
const COLUMNS_PAGE = [
  '<!doctype html><html><body>',
  '<a href="/queue" data-testid="LOGO_LINK"><span data-testid="LOGO_TEXT">LOGO</span></a>',
  '<div data-testid="FAKE_BTN" style="cursor:pointer">looks clickable</div>',
  '<input data-testid="NAME_INPUT" id="mantine-gwrqe5vg6" placeholder="my-guild">',
  '<button data-testid="GO_BTN">GO</button>',
  '<div data-testid="SPACER" style="height:8px"></div>',
  '</body></html>',
].join('');

const AMBIGUOUS_URL = `data:text/html,${encodeURIComponent(AMBIGUOUS_PAGE)}`;
const SECOND_URL = `data:text/html,${encodeURIComponent(SECOND_PAGE)}`;
const COLUMNS_URL = `data:text/html,${encodeURIComponent(COLUMNS_PAGE)}`;

// A single-element unwrap with no conditional in it: the reduce takes the last match, and the
// seed is a ref that exists but is the WRONG element, so an empty filter fails the assertion
// rather than silently skipping the click.
const FALLBACK_REF = RefStub({ value: 1 });

describe('playwrightSessionAdapter against a real Chromium', () => {
  describe('the addressing dead end', () => {
    it(
      'VALID: {two PIXEL_BTNs sharing one MAP_FRAME} => distinct refs, and a click by ref hits the RIGHT one',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });

        // The dead end itself, reproduced: scoping by the shared `within` still leaves two, so the
        // recovery the ambiguity error names cannot be performed.
        const scopedCount = await session.countMatches({
          target: '[data-testid="PIXEL_BTN"]',
          within: '[data-testid="MAP_FRAME"]',
        });

        const before = await session.look({ within: null });
        const buttons = before.rows.filter((row) => row.testId === 'PIXEL_BTN');
        const refs = buttons.map((row) => row.ref);
        const labels = buttons.map((row) => row.text);
        const siblings = buttons.map((row) => row.sibling);
        const createRef = buttons
          .filter((row) => row.text === 'CREATE')
          .reduce((_carried, row) => row.ref, FALLBACK_REF);

        await session.clickRef({ ref: createRef, timeoutMs: CLICK_TIMEOUT_MS });

        const after = await session.look({ within: null });
        const resultText = after.rows
          .filter((row) => row.testId === 'RESULT')
          .map((row) => row.text);
        await session.close();

        expect({ scopedCount, refs, labels, siblings, createRef, resultText }).toStrictEqual({
          scopedCount: 2,
          refs: [2, 3],
          labels: ['BROWSE', 'CREATE'],
          siblings: ['1/2', '2/2'],
          createRef: 3,
          resultText: ['CREATE'],
        });
      },
      BROWSER_TIMEOUT_MS,
    );

    it(
      'VALID: {a second look on the same page state} => every ref keeps its number, because a ref binds to an ELEMENT',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });

        const first = await session.look({ within: null });
        const second = await session.look({ within: null });
        const firstRefs = first.rows.map((row) => row.ref);
        const secondRefs = second.rows.map((row) => row.ref);
        await session.close();

        expect({ firstRefs, secondRefs }).toStrictEqual({
          firstRefs: [1, 2, 3, 4, 5, 6],
          secondRefs: [1, 2, 3, 4, 5, 6],
        });
      },
      BROWSER_TIMEOUT_MS,
    );
  });

  describe('own text nodes, never textContent', () => {
    it(
      "VALID: {a container holding a style block and a nested child} => the row's text is its OWN words and nothing below it",
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });

        const listing = await session.look({ within: null });
        const parentText = listing.rows
          .filter((row) => row.testId === 'OWN_TEXT_PARENT')
          .map((row) => row.text);
        const childText = listing.rows
          .filter((row) => row.testId === 'NESTED_CHILD')
          .map((row) => row.text);
        const styleRows = listing.rows.filter((row) => row.tag === 'style').map((row) => row.ref);
        await session.close();

        expect({ parentText, childText, styleRows }).toStrictEqual({
          parentText: ['own words'],
          childText: ['nested words'],
          styleRows: [],
        });
      },
      BROWSER_TIMEOUT_MS,
    );
  });

  describe('the tree is a TREE', () => {
    it(
      'VALID: {a page with a bare wrapper div} => depth is real nesting, and the wrapper produced no row at all',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });

        const listing = await session.look({ within: null });
        const shape = listing.rows.map((row) => ({
          ref: row.ref,
          depth: row.depth,
          testId: row.testId,
          tag: row.tag,
        }));
        await session.close();

        expect(shape).toStrictEqual([
          { ref: 1, depth: 0, testId: 'MAP_FRAME', tag: 'div' },
          { ref: 2, depth: 1, testId: 'PIXEL_BTN', tag: 'button' },
          { ref: 3, depth: 1, testId: 'PIXEL_BTN', tag: 'button' },
          { ref: 4, depth: 0, testId: 'RESULT', tag: 'div' },
          { ref: 5, depth: 0, testId: 'OWN_TEXT_PARENT', tag: 'div' },
          { ref: 6, depth: 1, testId: 'NESTED_CHILD', tag: 'span' },
        ]);
      },
      BROWSER_TIMEOUT_MS,
    );

    it(
      'VALID: {look within a region} => only that region is read, and the scope rides the listing',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });

        const listing = await session.look({ within: '[data-testid="MAP_FRAME"]' });
        const shape = listing.rows.map((row) => ({ depth: row.depth, testId: row.testId }));
        const scope = listing.within;
        await session.close();

        expect({ scope, shape }).toStrictEqual({
          scope: '[data-testid="MAP_FRAME"]',
          shape: [
            { depth: 0, testId: 'MAP_FRAME' },
            { depth: 1, testId: 'PIXEL_BTN' },
            { depth: 1, testId: 'PIXEL_BTN' },
          ],
        });
      },
      BROWSER_TIMEOUT_MS,
    );
  });

  describe('the columns and flags stay quiet where they carry no message', () => {
    it(
      'VALID: {a button, an input and a spacer} => only a field reports a value, and only a real container reports empty',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: COLUMNS_URL });

        const listing = await session.look({ within: null });
        const shape = listing.rows.map((row) => ({
          testId: row.testId,
          text: row.text,
          value: row.value,
          placeholder: row.placeholder,
          domId: row.domId,
          flags: row.flags,
          attrs: row.attrs,
        }));
        await session.close();

        expect(shape).toStrictEqual([
          {
            testId: 'LOGO_LINK',
            text: null,
            value: null,
            placeholder: null,
            domId: null,
            flags: [],
            attrs: [{ name: 'href', value: '→ /queue' }],
          },
          {
            testId: 'LOGO_TEXT',
            text: 'LOGO',
            value: null,
            placeholder: null,
            domId: null,
            flags: [],
            attrs: [],
          },
          {
            testId: 'FAKE_BTN',
            text: 'looks clickable',
            value: null,
            placeholder: null,
            domId: null,
            flags: ['not-tabbable'],
            attrs: [],
          },
          {
            // `text` stays null and the placeholder rides its own column: for a field they are
            // different questions, so folding one into the other would make an empty field read as
            // though it held its own hint.
            testId: 'NAME_INPUT',
            text: null,
            value: '',
            placeholder: 'my-guild',
            domId: null,
            flags: [],
            attrs: [],
          },
          {
            testId: 'GO_BTN',
            text: 'GO',
            value: null,
            placeholder: null,
            domId: null,
            flags: [],
            attrs: [],
          },
          {
            testId: 'SPACER',
            text: null,
            value: null,
            placeholder: null,
            domId: null,
            flags: ['empty'],
            attrs: [],
          },
        ]);
      },
      BROWSER_TIMEOUT_MS,
    );
  });

  describe('a ref does not survive a navigation', () => {
    it(
      'VALID: {a ref minted before a navigation} => answers stale, naming the boundary, never a different element',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });
        const before = await session.look({ within: null });
        const createRef = before.rows
          .filter((row) => row.text === 'CREATE')
          .reduce((_carried, row) => row.ref, FALLBACK_REF);

        const liveState = await session.refState({ ref: createRef });
        await session.goto({ url: SECOND_URL });
        const afterState = await session.refState({ ref: createRef });
        await session.close();

        expect({ createRef, liveState, afterState }).toStrictEqual({
          createRef: 3,
          liveState: { state: 'live', boundary: null, highestMinted: 6 },
          afterState: { state: 'stale', boundary: 'navigation', highestMinted: 6 },
        });
      },
      BROWSER_TIMEOUT_MS,
    );

    it(
      'VALID: {a ref this instance never minted} => answers unknown, which is the cross-instance case',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });
        await session.look({ within: null });

        const result = await session.refState({ ref: 99 });
        await session.close();

        expect(result).toStrictEqual({ state: 'unknown', boundary: null, highestMinted: 6 });
      },
      BROWSER_TIMEOUT_MS,
    );
  });

  describe('the ambiguity error now carries refs', () => {
    it(
      'VALID: {two matches sharing a within} => describeMatches returns candidates whose refs are the ones look minted',
      async () => {
        const session = await playwrightSessionAdapter({
          baseUrl: BASE_URL,
          evidencePath: EVIDENCE_PATH,
        });
        await session.goto({ url: AMBIGUOUS_URL });
        const listing = await session.look({ within: null });
        const lookRefs = listing.rows
          .filter((row) => row.testId === 'PIXEL_BTN')
          .map((row) => row.ref);

        const candidates = await session.describeMatches({
          target: '[data-testid="PIXEL_BTN"]',
          within: '[data-testid="MAP_FRAME"]',
        });
        const candidateRefs = candidates.map((candidate) => candidate.ref);
        const candidateTexts = candidates.map((candidate) => candidate.text);
        const candidateWithins = candidates.map((candidate) => candidate.within);
        await session.close();

        expect({ lookRefs, candidateRefs, candidateTexts, candidateWithins }).toStrictEqual({
          lookRefs: [2, 3],
          candidateRefs: [2, 3],
          candidateTexts: ['BROWSE', 'CREATE'],
          candidateWithins: ['[data-testid="MAP_FRAME"]', '[data-testid="MAP_FRAME"]'],
        });
      },
      BROWSER_TIMEOUT_MS,
    );
  });
});
