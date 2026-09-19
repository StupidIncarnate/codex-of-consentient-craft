import { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';
import { KeyRowStub } from '../../../contracts/key-row/key-row.stub';
import { stepLookBroker } from './step-look-broker';
import { stepLookBrokerProxy } from './step-look-broker.proxy';

describe('stepLookBroker', () => {
  describe('the whole page', () => {
    it('VALID: {within: null} => returns the rendered key as the step reading', async () => {
      const proxy = stepLookBrokerProxy();
      const { session } = proxy.session({
        listing: KeyListingStub({
          rows: [
            KeyRowStub({ ref: 22, depth: 0, testId: 'MAP_FRAME', tag: 'div', text: null }),
            KeyRowStub({
              ref: 26,
              depth: 1,
              testId: 'PIXEL_BTN',
              tag: 'button',
              text: 'CREATE',
              sibling: '2/2',
            }),
          ],
          rendered: [
            'key: 2 rows',
            'ref  element                     text / value  attrs  flags',
            '---  --------------------------  ------------  -----  -----',
            ' 22  MAP_FRAME <div>',
            ' 26    PIXEL_BTN <button> [2/2]  "CREATE"',
          ].join('\n'),
        }),
      });

      const result = await stepLookBroker({ session, within: null });

      expect(result).toBe(
        [
          'key: 2 rows',
          'ref  element                     text / value  attrs  flags',
          '---  --------------------------  ------------  -----  -----',
          ' 22  MAP_FRAME <div>',
          ' 26    PIXEL_BTN <button> [2/2]  "CREATE"',
        ].join('\n'),
      );
    });

    it('VALID: {within: null} => drives the session with no scope, so the walk starts at the body', async () => {
      const proxy = stepLookBrokerProxy();
      const { session, getLookCalls } = proxy.session({ listing: KeyListingStub() });

      await stepLookBroker({ session, within: null });

      expect(getLookCalls()).toStrictEqual([[{ within: null }]]);
    });
  });

  describe('a scoped reading', () => {
    it("VALID: {within: a bare testId} => expands to the data-testid selector, so the spec's own shorthand reaches the element", async () => {
      const proxy = stepLookBrokerProxy();
      const { session, getLookCalls } = proxy.session({ listing: KeyListingStub() });

      await stepLookBroker({ session, within: 'SUBAGENT_CHAIN_HEADER' });

      expect(getLookCalls()).toStrictEqual([[{ within: '[data-testid="SUBAGENT_CHAIN_HEADER"]' }]]);
    });

    it('VALID: {within: an explicit selector} => passed through untouched, so a scope copied out of an ambiguity error works', async () => {
      const proxy = stepLookBrokerProxy();
      const { session, getLookCalls } = proxy.session({ listing: KeyListingStub() });

      await stepLookBroker({ session, within: '[data-testid="MAP_FRAME"]' });

      expect(getLookCalls()).toStrictEqual([[{ within: '[data-testid="MAP_FRAME"]' }]]);
    });

    it('VALID: {within} => the scoped listing renders its own summary naming the scope', async () => {
      const proxy = stepLookBrokerProxy();
      const { session } = proxy.session({
        listing: KeyListingStub({
          within: '[data-testid="MAP_FRAME"]',
          rendered: 'key: 0 rows within [data-testid="MAP_FRAME"]',
        }),
      });

      const result = await stepLookBroker({ session, within: 'MAP_FRAME' });

      expect(result).toBe('key: 0 rows within [data-testid="MAP_FRAME"]');
    });
  });

  describe('an empty page', () => {
    it('EMPTY: {a page with no addressable element} => the reading SAYS so rather than coming back blank', async () => {
      const proxy = stepLookBrokerProxy();
      const { session } = proxy.session({
        listing: KeyListingStub({
          rows: [],
          rendered: [
            'key: 0 rows',
            'Nothing here is addressable — no element carries a data-testid, its own text, a control or an image. If the page should have painted by now, that IS the finding.',
          ].join('\n'),
        }),
      });

      const result = await stepLookBroker({ session, within: null });

      expect(result).toBe(
        [
          'key: 0 rows',
          'Nothing here is addressable — no element carries a data-testid, its own text, a control or an image. If the page should have painted by now, that IS the finding.',
        ].join('\n'),
      );
    });
  });
});
