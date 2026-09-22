import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ElementDeltaStub } from '../../../contracts/element-delta/element-delta.stub';
import { KeyRowStub } from '../../../contracts/key-row/key-row.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';

import { elementDeltaLastLayerBroker } from './element-delta-last-layer-broker';
import { elementDeltaLastLayerBrokerProxy } from './element-delta-last-layer-broker.proxy';

const rowFor = (reading: ReturnType<typeof StepReadingStub>): ReturnType<typeof ContentTextStub> =>
  ContentTextStub({ value: JSON.stringify(reading) });

describe('elementDeltaLastLayerBroker', () => {
  describe('a single row carrying a delta', () => {
    it('VALID: {one row with a non-null delta} => returns that delta', () => {
      elementDeltaLastLayerBrokerProxy();
      const delta = ElementDeltaStub({ appeared: [KeyRowStub({ testId: 'GUILD_ADD_MODAL' })] });
      const rows = [rowFor(StepReadingStub({ step: StepIndexStub({ value: 1 }), delta }))];

      const result = elementDeltaLastLayerBroker({ rows });

      expect(result).toStrictEqual(delta);
    });
  });

  describe('several rows, the delta at the end', () => {
    it("VALID: {delta on step 1, null on step 2, delta on step 3} => returns step 3's delta", () => {
      elementDeltaLastLayerBrokerProxy();
      const firstDelta = ElementDeltaStub({ appeared: [KeyRowStub({ testId: 'FIRST' })] });
      const lastDelta = ElementDeltaStub({ disappeared: [KeyRowStub({ testId: 'LAST' })] });
      const rows = [
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 1 }), delta: firstDelta })),
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 2 }) })),
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 3 }), delta: lastDelta })),
      ];

      const result = elementDeltaLastLayerBroker({ rows });

      expect(result).toStrictEqual(lastDelta);
    });
  });

  describe('several rows, the tail carrying no delta', () => {
    it("VALID: {delta on step 1, null on step 2} => returns step 1's delta, skipping the null tail", () => {
      elementDeltaLastLayerBrokerProxy();
      const onlyDelta = ElementDeltaStub({
        changed: [
          {
            before: KeyRowStub({ testId: 'X', text: 'old' }),
            after: KeyRowStub({ testId: 'X', text: 'new' }),
          },
        ],
      });
      const rows = [
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 1 }), delta: onlyDelta })),
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 2 }) })),
      ];

      const result = elementDeltaLastLayerBroker({ rows });

      expect(result).toStrictEqual(onlyDelta);
    });
  });

  describe('no row ever recorded a delta', () => {
    it('VALID: {every row has delta: null} => returns null', () => {
      elementDeltaLastLayerBrokerProxy();
      const rows = [
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 1 }) })),
        rowFor(StepReadingStub({ step: StepIndexStub({ value: 2 }) })),
      ];

      const result = elementDeltaLastLayerBroker({ rows });

      expect(result).toBe(null);
    });
  });

  describe('no rows at all', () => {
    it('EMPTY: {rows: []} => returns null', () => {
      elementDeltaLastLayerBrokerProxy();

      const result = elementDeltaLastLayerBroker({ rows: [] });

      expect(result).toBe(null);
    });
  });
});
