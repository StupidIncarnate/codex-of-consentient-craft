import { resultsStatics } from '../../../statics/results/results-statics';

import { newLinesLayerBroker } from './new-lines-layer-broker';
import { newLinesLayerBrokerProxy } from './new-lines-layer-broker.proxy';

describe('newLinesLayerBroker', () => {
  describe('a genuine difference', () => {
    it('VALID: {linesA: ["a"], linesB: ["a","b"]} => returns only the line unique to linesB', () => {
      newLinesLayerBrokerProxy();
      const linesA = ['a'];
      const linesB = ['a', 'b'];

      const result = newLinesLayerBroker({ linesA, linesB });

      expect(result).toStrictEqual(['b']);
    });
  });

  describe('no difference', () => {
    it('EMPTY: {linesA: [], linesB: []} => returns an empty list', () => {
      newLinesLayerBrokerProxy();

      const result = newLinesLayerBroker({ linesA: [], linesB: [] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {linesA and linesB identical} => returns an empty list', () => {
      newLinesLayerBrokerProxy();
      const linesA = ['x'];
      const linesB = ['x'];

      const result = newLinesLayerBroker({ linesA, linesB });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates inside linesB', () => {
    it('VALID: {linesB repeats the same new line twice} => the new list carries it once', () => {
      newLinesLayerBrokerProxy();
      const linesA: never[] = [];
      const linesB = ['c', 'c'];

      const result = newLinesLayerBroker({ linesA, linesB });

      expect(result).toStrictEqual(['c']);
    });
  });

  describe('the maxRows cap', () => {
    it('EDGE: {more new lines than maxRows} => returns exactly the first maxRows, in order', () => {
      newLinesLayerBrokerProxy();
      const overflow = 5;
      const linesB = Array.from(
        { length: resultsStatics.limits.maxRows + overflow },
        (_unused, index) => `line-${String(index)}`,
      );

      const result = newLinesLayerBroker({ linesA: [], linesB });

      expect(result).toStrictEqual(
        Array.from(
          { length: resultsStatics.limits.maxRows },
          (_unused, index) => `line-${String(index)}`,
        ),
      );
    });
  });
});
