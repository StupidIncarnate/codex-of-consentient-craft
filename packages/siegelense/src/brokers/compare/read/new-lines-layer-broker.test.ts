import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { resultsStatics } from '../../../statics/results/results-statics';

import { newLinesLayerBroker } from './new-lines-layer-broker';
import { newLinesLayerBrokerProxy } from './new-lines-layer-broker.proxy';

describe('newLinesLayerBroker', () => {
  describe('a genuine difference', () => {
    it('VALID: {linesA: ["a"], linesB: ["a","b"]} => returns only the line unique to linesB', () => {
      newLinesLayerBrokerProxy();
      const linesA = [ContentTextStub({ value: 'a' })];
      const linesB = [ContentTextStub({ value: 'a' }), ContentTextStub({ value: 'b' })];

      const result = newLinesLayerBroker({ linesA, linesB });

      expect(result).toStrictEqual([ContentTextStub({ value: 'b' })]);
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
      const linesA = [ContentTextStub({ value: 'x' })];
      const linesB = [ContentTextStub({ value: 'x' })];

      const result = newLinesLayerBroker({ linesA, linesB });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates inside linesB', () => {
    it('VALID: {linesB repeats the same new line twice} => the new list carries it once', () => {
      newLinesLayerBrokerProxy();
      const linesA: never[] = [];
      const linesB = [ContentTextStub({ value: 'c' }), ContentTextStub({ value: 'c' })];

      const result = newLinesLayerBroker({ linesA, linesB });

      expect(result).toStrictEqual([ContentTextStub({ value: 'c' })]);
    });
  });

  describe('the maxRows cap', () => {
    it('EDGE: {more new lines than maxRows} => returns exactly the first maxRows, in order', () => {
      newLinesLayerBrokerProxy();
      const overflow = 5;
      const linesB = Array.from(
        { length: resultsStatics.limits.maxRows + overflow },
        (_unused, index) => ContentTextStub({ value: `line-${String(index)}` }),
      );

      const result = newLinesLayerBroker({ linesA: [], linesB });

      expect(result).toStrictEqual(
        Array.from({ length: resultsStatics.limits.maxRows }, (_unused, index) =>
          ContentTextStub({ value: `line-${String(index)}` }),
        ),
      );
    });
  });
});
