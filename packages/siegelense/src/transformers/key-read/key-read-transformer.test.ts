import { RawKeyReadingStub } from '../../contracts/raw-key-reading/raw-key-reading.stub';
import { keyReadTransformer } from './key-read-transformer';

describe('keyReadTransformer', () => {
  describe('readSource()', () => {
    it('VALID: {the source} => never reads through querySelector, which silently returns match one', () => {
      const key = keyReadTransformer();

      const singularQueryAt = key.readSource({ within: null }).indexOf('querySelector(');

      expect(singularQueryAt).toBe(-1);
    });

    it('VALID: {the source} => never reads textContent, which once pulled a whole stylesheet into one reading', () => {
      const key = keyReadTransformer();

      const textContentAt = key.readSource({ within: null }).indexOf('textContent');

      expect(textContentAt).toBe(-1);
    });

    it('VALID: {the source} => reads own text off child nodes of type 3, through nodeValue', () => {
      const key = keyReadTransformer();

      const ownTextReadAt = key
        .readSource({ within: null })
        .indexOf("if (node.nodeType === 3) { text += node.nodeValue || ''; }");

      expect(ownTextReadAt).toBeGreaterThan(-1);
    });

    it('VALID: {within: null} => the embedded scope is null, so the walk starts at the body', () => {
      const key = keyReadTransformer();

      const scopeAt = key.readSource({ within: null }).indexOf('"within":null');

      expect(scopeAt).toBeGreaterThan(-1);
    });

    it('VALID: {within: a selector} => the scope is embedded as JSON for the querySelectorAll roots', () => {
      const key = keyReadTransformer();

      const scopeAt = key
        .readSource({ within: '[data-testid="MAP_FRAME"]' })
        .indexOf('"within":"[data-testid=\\"MAP_FRAME\\"]"');

      expect(scopeAt).toBeGreaterThan(-1);
    });

    it('VALID: {the source} => is a self-invoking call, because Playwright never CALLS a source string', () => {
      const key = keyReadTransformer();

      const source = key.readSource({ within: null });

      expect(source.startsWith('((params) => {')).toBe(true);
    });
  });

  describe('highestRefOf()', () => {
    it("VALID: {a reading} => returns the registry's length, which is what tells a navigation from another instance", () => {
      const key = keyReadTransformer();

      const result = key.highestRefOf({ raw: RawKeyReadingStub({ highestRef: 41 }) });

      expect(result).toBe(41);
    });
  });

  describe('toListing()', () => {
    it('VALID: {two rows} => each becomes a KeyRow with its budgeted attrs, and the listing renders', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: 'MAP_FRAME',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [{ name: 'class', value: 'm-4081bf90' }],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 2,
              depth: 1,
              parentRef: 1,
              testId: 'PIXEL_BTN',
              tag: 'button',
              role: null,
              domId: null,
              text: 'BROWSE',
              value: null,
              placeholder: null,
              attributes: [{ name: 'data-status', value: 'open' }],
              flags: ['disabled'],
              flagDetail: {},
            },
          ],
          highestRef: 2,
        }),
        within: null,
      });

      expect(result).toStrictEqual({
        within: null,
        rows: [
          {
            ref: 1,
            depth: 0,
            testId: 'MAP_FRAME',
            tag: 'div',
            role: null,
            domId: null,
            sibling: null,
            text: null,
            value: null,
            placeholder: null,
            attrs: [],
            attrsDropped: 0,
            flags: [],
            flagDetail: {},
          },
          {
            ref: 2,
            depth: 1,
            testId: 'PIXEL_BTN',
            tag: 'button',
            role: null,
            domId: null,
            sibling: null,
            text: 'BROWSE',
            value: null,
            placeholder: null,
            attrs: [{ name: 'data-status', value: 'open' }],
            attrsDropped: 0,
            flags: ['disabled'],
            flagDetail: {},
          },
        ],
        duplicates: [],
        truncated: [],
        rendered: [
          'key: 2 rows',
          'ref  element               text / value  attributes        flags',
          '---  --------------------  ------------  ----------------  --------',
          '  1  MAP_FRAME <div>',
          '  2    PIXEL_BTN <button>  "BROWSE"      data-status=open  disabled',
        ].join('\n'),
      });
    });

    it('VALID: {two siblings sharing a testId under one parent} => each gets its nth marker, which is how the two are told apart', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: 'MAP_FRAME',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 2,
              depth: 1,
              parentRef: 1,
              testId: 'PIXEL_BTN',
              tag: 'button',
              role: null,
              domId: null,
              text: 'BROWSE',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 3,
              depth: 1,
              parentRef: 1,
              testId: 'PIXEL_BTN',
              tag: 'button',
              role: null,
              domId: null,
              text: 'CREATE',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
          ],
          highestRef: 3,
        }),
        within: null,
      });

      expect(result.rows.map((row) => row.sibling)).toStrictEqual([null, '1/2', '2/2']);
    });

    it('VALID: {a testId under two different parents} => a duplicate line names both parents, which is the case the nth marker cannot catch', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: 'SUBAGENT_CHAIN_HEADER',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 2,
              depth: 1,
              parentRef: 1,
              testId: 'subagent-chain-duration',
              tag: 'span',
              role: null,
              domId: null,
              text: '4m',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 3,
              depth: 0,
              parentRef: null,
              testId: 'CHAT_PANEL',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 4,
              depth: 1,
              parentRef: 3,
              testId: 'subagent-chain-duration',
              tag: 'span',
              role: null,
              domId: null,
              text: '4m',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
          ],
          highestRef: 4,
        }),
        within: null,
      });

      expect(result.duplicates).toStrictEqual([
        '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
      ]);
    });

    it('VALID: {generated ids whose last character is a digit AND a letter} => both print with the minted segment masked, the same way', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: 'GUILD_NAME_INPUT',
              tag: 'input',
              role: null,
              domId: 'mantine-gwrqe5vg6',
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 2,
              depth: 0,
              parentRef: null,
              testId: 'GUILD_PATH_INPUT',
              tag: 'input',
              role: null,
              domId: 'mantine-oxhnuns51',
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 3,
              depth: 0,
              parentRef: null,
              testId: 'GUILD_NAME_LABEL',
              tag: 'label',
              role: null,
              domId: 'mantine-nsg303p87-label',
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
          ],
          highestRef: 3,
        }),
        within: null,
      });

      expect(result.rows.map((row) => row.domId)).toStrictEqual([
        'mantine-*',
        'mantine-*',
        'mantine-*-label',
      ]);
    });

    it('VALID: {three PIXEL_BTN under two different parents} => all three counted and numbered [1/3] to [3/3] in page order, and the duplicate line says 3×', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: 'GUILD_INPUT_ALIGNMENT_GROUP',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 2,
              depth: 1,
              parentRef: 1,
              testId: 'PIXEL_BTN',
              tag: 'button',
              role: null,
              domId: null,
              text: 'BROWSE',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 3,
              depth: 0,
              parentRef: null,
              testId: 'MAP_FRAME',
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 4,
              depth: 1,
              parentRef: 3,
              testId: 'PIXEL_BTN',
              tag: 'button',
              role: null,
              domId: null,
              text: 'CREATE',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
            {
              ref: 5,
              depth: 1,
              parentRef: 3,
              testId: 'PIXEL_BTN',
              tag: 'button',
              role: null,
              domId: null,
              text: 'CANCEL',
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
          ],
          highestRef: 5,
        }),
        within: null,
      });

      expect(result.rows.map((row) => row.sibling)).toStrictEqual([
        null,
        '1/3',
        null,
        '2/3',
        '3/3',
      ]);
      expect(result.duplicates).toStrictEqual([
        '… PIXEL_BTN appears 3× — under GUILD_INPUT_ALIGNMENT_GROUP and under MAP_FRAME',
      ]);
    });

    it('VALID: {a stable DOM id} => kept, because it is the app speaking and not a mint', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: null,
              tag: 'div',
              role: null,
              domId: 'root',
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: [],
              flagDetail: {},
            },
          ],
          highestRef: 1,
        }),
        within: null,
      });

      expect(result.rows.map((row) => row.domId)).toStrictEqual(['root']);
    });

    it('VALID: {a skipped group} => a truncation line names the count and the container, so the key never quietly stops', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub({ skipped: [{ under: 'CHAT_MESSAGES_AREA', count: 12 }] }),
        within: null,
      });

      expect(result.truncated).toStrictEqual(['… 12 more under CHAT_MESSAGES_AREA']);
    });

    it('VALID: {within} => the scope rides the listing and its summary line', () => {
      const key = keyReadTransformer();

      const result = key.toListing({
        raw: RawKeyReadingStub(),
        within: '[data-testid="MAP_FRAME"]',
      });

      expect(result.within).toBe('[data-testid="MAP_FRAME"]');
    });

    it('EMPTY: {no rows} => the rendered reading SAYS it is empty rather than coming back blank', () => {
      const key = keyReadTransformer();

      const result = key.toListing({ raw: RawKeyReadingStub(), within: null });

      expect(result.rendered).toBe(
        [
          'key: 0 rows',
          'Nothing here is addressable — no element carries a data-testid, its own text, a control or an image. If the page should have painted by now, that IS the finding.',
        ].join('\n'),
      );
    });

    it('ERROR: {raw: a shape the page never produces} => throws rather than handing back a half-built key', () => {
      const key = keyReadTransformer();

      expect(() => key.toListing({ raw: { rows: [] }, within: null })).toThrow(
        /received undefined/u,
      );
    });
  });
});
