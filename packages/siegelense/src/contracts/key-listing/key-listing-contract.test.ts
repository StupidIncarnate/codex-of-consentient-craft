import { KeyRowStub } from '../key-row/key-row.stub';
import { keyListingContract } from './key-listing-contract';
import { KeyListingStub } from './key-listing.stub';

describe('keyListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {rows, duplicates and truncation} => parses whole', () => {
      const listing = KeyListingStub({
        within: null,
        rows: [KeyRowStub({ ref: 26, depth: 0, testId: 'SUBAGENT_CHAIN', tag: 'div', text: null })],
        duplicates: [
          '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
        ],
        truncated: ['… 12 more under CHAT_MESSAGES_AREA'],
        rendered: 'key: 26  SUBAGENT_CHAIN <div>',
      });

      const result = keyListingContract.parse(listing);

      expect(result).toStrictEqual({
        within: null,
        rows: [
          {
            ref: 26,
            depth: 0,
            testId: 'SUBAGENT_CHAIN',
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
        ],
        duplicates: [
          '… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL',
        ],
        truncated: ['… 12 more under CHAT_MESSAGES_AREA'],
        rendered: 'key: 26  SUBAGENT_CHAIN <div>',
      });
    });

    it('VALID: {within: a selector} => the scope rides the listing, so a reader knows what it did not see', () => {
      const listing = KeyListingStub({ within: '[data-testid="SUBAGENT_CHAIN_HEADER"]' });

      const result = keyListingContract.parse(listing);

      expect(result.within).toBe('[data-testid="SUBAGENT_CHAIN_HEADER"]');
    });
  });

  describe('invalid listings', () => {
    it('INVALID: {map: "shots/step4-map.png"} => throws naming the stray key, because the map ships later and the field is ABSENT', () => {
      expect(() =>
        keyListingContract.parse({ ...KeyListingStub(), map: 'shots/step4-map.png' }),
      ).toThrow(/Unrecognized key\(s\) in object: 'map'/u);
    });

    it('INVALID: {missing rendered} => throws Required, because the key IS the navigation surface', () => {
      expect(() =>
        keyListingContract.parse({ within: null, rows: [], duplicates: [], truncated: [] }),
      ).toThrow(/Required/u);
    });
  });
});
