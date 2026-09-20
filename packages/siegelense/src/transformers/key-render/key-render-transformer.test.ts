import { KeyListingStub } from '../../contracts/key-listing/key-listing.stub';
import { KeyRowStub } from '../../contracts/key-row/key-row.stub';
import { keyRenderTransformer } from './key-render-transformer';

describe('keyRenderTransformer', () => {
  describe('the whole key', () => {
    it("VALID: {the spec's own worked key} => renders line for line", () => {
      const listing = KeyListingStub({
        within: null,
        rows: [
          KeyRowStub({ ref: 22, depth: 0, testId: 'SUBAGENT_CHAIN', tag: 'div', text: null }),
          KeyRowStub({
            ref: 23,
            depth: 1,
            testId: 'SUBAGENT_CHAIN_HEADER',
            tag: 'div',
            text: null,
          }),
          KeyRowStub({ ref: 24, depth: 2, testId: null, tag: 'p', text: '▾ SUB-AGENT' }),
          KeyRowStub({
            ref: 25,
            depth: 2,
            testId: null,
            tag: 'p',
            text: 'Finished sub-agent (1 entries)',
          }),
          KeyRowStub({
            ref: 26,
            depth: 2,
            testId: 'subagent-chain-duration',
            tag: 'span',
            text: '4m',
            flags: ['clipped-x'],
          }),
          KeyRowStub({
            ref: 27,
            depth: 1,
            testId: 'CHAT_MESSAGE',
            tag: 'div',
            text: null,
            sibling: '1/2',
          }),
          KeyRowStub({
            ref: 32,
            depth: 0,
            testId: 'PIXEL_BTN',
            tag: 'button',
            text: 'CREATE',
            flags: ['disabled'],
          }),
          KeyRowStub({
            ref: 35,
            depth: 0,
            testId: 'HOME_QUEUE_LINK',
            tag: 'a',
            text: '⚔ EXECUTION QUEUE',
            attrs: [{ name: 'href', value: '→ /queue' }],
          }),
          KeyRowStub({
            ref: 38,
            depth: 0,
            testId: 'DOCS_LINK',
            tag: 'a',
            text: 'docs',
            attrs: [{ name: 'href', value: '→ /docs ↗' }],
          }),
          KeyRowStub({
            ref: 41,
            depth: 0,
            testId: 'GUILD_NAME_INPUT',
            tag: 'input',
            text: null,
            value: '',
            placeholder: 'my-guild',
            attrs: [{ name: 'maxlength', value: '40' }],
            flags: ['focused'],
          }),
          KeyRowStub({
            ref: 52,
            depth: 0,
            testId: 'QUEST_ROW_9a1b',
            tag: 'div',
            role: 'button',
            domId: 'quest-row',
            text: 'older quest',
            attrs: [{ name: 'data-status', value: 'failed' }],
            flags: ['offscreen', 'low-contrast'],
            flagDetail: { 'low-contrast': '1.4' },
          }),
        ],
        duplicates: [
          '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
        ],
        truncated: ['… 12 more under CHAT_MESSAGES_AREA'],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 11 rows',
          'ref  element                                      text / value                      attrs               flags',
          '---  -------------------------------------------  --------------------------------  ------------------  --------------------------',
          ' 22  SUBAGENT_CHAIN <div>',
          ' 23    SUBAGENT_CHAIN_HEADER <div>',
          ' 24      (p)                                      "▾ SUB-AGENT"',
          ' 25      (p)                                      "Finished sub-agent (1 entries)"',
          ' 26      subagent-chain-duration <span>           "4m"                                                  clipped-x',
          ' 27    CHAT_MESSAGE <div> [1/2]',
          ' 32  PIXEL_BTN <button>                           "CREATE"                                              disabled',
          ' 35  HOME_QUEUE_LINK <a>                          "⚔ EXECUTION QUEUE"               → /queue',
          ' 38  DOCS_LINK <a>                                "docs"                            → /docs ↗',
          ' 41  GUILD_NAME_INPUT <input>                     "" ph:"my-guild"                  maxlength=40        focused',
          ' 52  QUEST_ROW_9a1b <div role=button> #quest-row  "older quest"                     data-status=failed  offscreen low-contrast 1.4',
          '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
          '… 12 more under CHAT_MESSAGES_AREA',
        ].join('\n'),
      );
    });
  });

  describe('the element column', () => {
    it('VALID: {an untagged element} => renders as its tag in brackets', () => {
      const listing = KeyListingStub({
        rows: [KeyRowStub({ ref: 24, depth: 0, testId: null, tag: 'p', text: '▾ SUB-AGENT' })],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element  text / value   attrs  flags',
          '---  -------  -------------  -----  -----',
          ' 24  (p)      "▾ SUB-AGENT"',
        ].join('\n'),
      );
    });

    it('VALID: {a testId row} => the tag prints too, because a testId never says whether a keyboard can reach it', () => {
      const listing = KeyListingStub({
        rows: [KeyRowStub({ ref: 32, depth: 0, testId: 'PIXEL_BTN', tag: 'div', text: 'CREATE' })],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element          text / value  attrs  flags',
          '---  ---------------  ------------  -----  -----',
          ' 32  PIXEL_BTN <div>  "CREATE"',
        ].join('\n'),
      );
    });

    it('VALID: {a role} => sits inside the brackets with the tag, never in attrs', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 52,
            depth: 0,
            testId: 'QUEST_ROW',
            tag: 'div',
            role: 'button',
            text: 'older quest',
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element                      text / value   attrs  flags',
          '---  ---------------------------  -------------  -----  -----',
          ' 52  QUEST_ROW <div role=button>  "older quest"',
        ].join('\n'),
      );
    });

    it('VALID: {siblings sharing a name} => the nth marker prints after the tag', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 27,
            depth: 0,
            testId: 'CHAT_MESSAGE',
            tag: 'div',
            text: null,
            sibling: '1/2',
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element                   text / value  attrs  flags',
          '---  ------------------------  ------------  -----  -----',
          ' 27  CHAT_MESSAGE <div> [1/2]',
        ].join('\n'),
      );
    });

    it('VALID: {nested rows} => depth becomes two spaces of indentation per level, which is what makes indentation scope', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({ ref: 1, depth: 0, testId: 'A', tag: 'div', text: null }),
          KeyRowStub({ ref: 2, depth: 1, testId: 'B', tag: 'div', text: null }),
          KeyRowStub({ ref: 3, depth: 2, testId: 'C', tag: 'div', text: null }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 3 rows',
          'ref  element      text / value  attrs  flags',
          '---  -----------  ------------  -----  -----',
          '  1  A <div>',
          '  2    B <div>',
          '  3      C <div>',
        ].join('\n'),
      );
    });
  });

  describe('the text / value column', () => {
    it('VALID: {an input} => value and placeholder render as separate columns, because they are different questions', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 41,
            depth: 0,
            testId: 'GUILD_NAME_INPUT',
            tag: 'input',
            text: null,
            value: 'guild-alpha',
            placeholder: 'my-guild',
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element                   text / value                 attrs  flags',
          '---  ------------------------  ---------------------------  -----  -----',
          ' 41  GUILD_NAME_INPUT <input>  "guild-alpha" ph:"my-guild"',
        ].join('\n'),
      );
    });
  });

  describe('the attrs column', () => {
    it("VALID: {a link} => renders '→ /queue' with no href= prefix", () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 35,
            depth: 0,
            testId: 'HOME_QUEUE_LINK',
            tag: 'a',
            text: 'QUEUE',
            attrs: [{ name: 'href', value: '→ /queue' }],
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element              text / value  attrs     flags',
          '---  -------------------  ------------  --------  -----',
          ' 35  HOME_QUEUE_LINK <a>  "QUEUE"       → /queue',
        ].join('\n'),
      );
    });

    it("VALID: {a new-tab link} => renders '→ /docs ↗'", () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 38,
            depth: 0,
            testId: 'DOCS_LINK',
            tag: 'a',
            text: 'docs',
            attrs: [{ name: 'href', value: '→ /docs ↗' }],
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element        text / value  attrs      flags',
          '---  -------------  ------------  ---------  -----',
          ' 38  DOCS_LINK <a>  "docs"        → /docs ↗',
        ].join('\n'),
      );
    });

    it('VALID: {a boolean attribute} => renders its name alone', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 41,
            depth: 0,
            testId: 'NAME_INPUT',
            tag: 'input',
            text: null,
            attrs: [{ name: 'required', value: '' }],
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element             text / value  attrs     flags',
          '---  ------------------  ------------  --------  -----',
          ' 41  NAME_INPUT <input>                required',
        ].join('\n'),
      );
    });

    it('VALID: {a row past its attrs cap} => says how many it dropped rather than stopping silently', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 52,
            depth: 0,
            testId: 'QUEST_ROW',
            tag: 'div',
            text: null,
            attrs: [{ name: 'data-status', value: 'failed' }],
            attrsDropped: 3,
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element          text / value  attrs                       flags',
          '---  ---------------  ------------  --------------------------  -----',
          ' 52  QUEST_ROW <div>                data-status=failed +3 more',
        ].join('\n'),
      );
    });
  });

  describe('the flags column', () => {
    it('VALID: {a flag carrying a measurement} => the measurement prints beside the word', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 52,
            depth: 0,
            testId: 'QUEST_ROW',
            tag: 'div',
            text: 'older quest',
            flags: ['low-contrast'],
            flagDetail: { 'low-contrast': '1.4' },
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element          text / value   attrs  flags',
          '---  ---------------  -------------  -----  ----------------',
          ' 52  QUEST_ROW <div>  "older quest"         low-contrast 1.4',
        ].join('\n'),
      );
    });

    it('VALID: {a flag with no measurement} => the word alone is the whole message', () => {
      const listing = KeyListingStub({
        rows: [
          KeyRowStub({
            ref: 32,
            depth: 0,
            testId: 'PIXEL_BTN',
            tag: 'button',
            text: 'CREATE',
            flags: ['disabled'],
          }),
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element             text / value  attrs  flags',
          '---  ------------------  ------------  -----  --------',
          ' 32  PIXEL_BTN <button>  "CREATE"             disabled',
        ].join('\n'),
      );
    });
  });

  describe('the key-level readings', () => {
    it('VALID: {a testId under two parents} => a duplicate line under the key naming both parents', () => {
      const listing = KeyListingStub({
        rows: [KeyRowStub({ ref: 1, depth: 0, testId: 'A', tag: 'div', text: null })],
        duplicates: [
          '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
        ],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element  text / value  attrs  flags',
          '---  -------  ------------  -----  -----',
          '  1  A <div>',
          '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
        ].join('\n'),
      );
    });

    it('VALID: {a scope that omitted rows} => a truncation line naming the count and the container', () => {
      const listing = KeyListingStub({
        rows: [KeyRowStub({ ref: 1, depth: 0, testId: 'A', tag: 'div', text: null })],
        truncated: ['… 12 more under CHAT_MESSAGES_AREA'],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows',
          'ref  element  text / value  attrs  flags',
          '---  -------  ------------  -----  -----',
          '  1  A <div>',
          '… 12 more under CHAT_MESSAGES_AREA',
        ].join('\n'),
      );
    });

    it('VALID: {within} => the summary line states the scope, so a reader knows what it did not see', () => {
      const listing = KeyListingStub({
        within: '[data-testid="SUBAGENT_CHAIN_HEADER"]',
        rows: [KeyRowStub({ ref: 1, depth: 0, testId: 'A', tag: 'div', text: null })],
      });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 1 rows within [data-testid="SUBAGENT_CHAIN_HEADER"]',
          'ref  element  text / value  attrs  flags',
          '---  -------  ------------  -----  -----',
          '  1  A <div>',
        ].join('\n'),
      );
    });
  });

  describe('an empty page', () => {
    it('EMPTY: {no rows} => the reading SAYS it is empty, because a blank answer reads exactly like a page that failed to paint', () => {
      const listing = KeyListingStub({ within: null, rows: [] });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 0 rows',
          'Nothing here is addressable — no element carries a data-testid, its own text, a control or an image. If the page should have painted by now, that IS the finding.',
        ].join('\n'),
      );
    });

    it('EMPTY: {no rows under a within scope} => the empty reading still names the scope it read', () => {
      const listing = KeyListingStub({ within: '[data-testid="MAP_FRAME"]', rows: [] });

      const result = keyRenderTransformer({ listing });

      expect(result).toBe(
        [
          'key: 0 rows within [data-testid="MAP_FRAME"]',
          'Nothing here is addressable — no element carries a data-testid, its own text, a control or an image. If the page should have painted by now, that IS the finding.',
        ].join('\n'),
      );
    });
  });
});
