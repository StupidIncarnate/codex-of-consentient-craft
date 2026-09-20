import { rawKeyReadingContract } from './raw-key-reading-contract';
import { RawKeyReadingStub } from './raw-key-reading.stub';

describe('rawKeyReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {one row, a registry length and no skips} => parses whole', () => {
      const reading = RawKeyReadingStub({
        rows: [
          {
            ref: 1,
            depth: 0,
            parentRef: null,
            testId: 'SUBAGENT_CHAIN',
            tag: 'div',
            role: null,
            domId: null,
            text: null,
            value: null,
            placeholder: null,
            attributes: [{ name: 'data-status', value: 'open' }],
            flags: ['empty'],
            flagDetail: {},
          },
        ],
        highestRef: 1,
        skipped: [],
      });

      const result = rawKeyReadingContract.parse(reading);

      expect(result).toStrictEqual({
        rows: [
          {
            ref: 1,
            depth: 0,
            parentRef: null,
            testId: 'SUBAGENT_CHAIN',
            tag: 'div',
            role: null,
            domId: null,
            text: null,
            value: null,
            placeholder: null,
            attributes: [{ name: 'data-status', value: 'open' }],
            flags: ['empty'],
            flagDetail: {},
          },
        ],
        highestRef: 1,
        skipped: [],
      });
    });

    it('VALID: {a skip entry} => parses the container it was left out of and how many', () => {
      const reading = RawKeyReadingStub({
        skipped: [{ under: 'CHAT_MESSAGES_AREA', count: 12 }],
      });

      const result = rawKeyReadingContract.parse(reading);

      expect(result.skipped).toStrictEqual([{ under: 'CHAT_MESSAGES_AREA', count: 12 }]);
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {a flag the statics do not name} => throws, so the page source and the flag vocabulary cannot drift apart', () => {
      expect(() =>
        rawKeyReadingContract.parse({
          rows: [
            {
              ref: 1,
              depth: 0,
              parentRef: null,
              testId: null,
              tag: 'div',
              role: null,
              domId: null,
              text: null,
              value: null,
              placeholder: null,
              attributes: [],
              flags: ['has-listener'],
              flagDetail: {},
            },
          ],
          highestRef: 1,
          skipped: [],
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing highestRef} => throws Required, because without it a navigation cannot be told from another instance', () => {
      expect(() => rawKeyReadingContract.parse({ rows: [], skipped: [] })).toThrow(/Required/u);
    });
  });
});
