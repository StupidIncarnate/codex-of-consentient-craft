import { ResultWhereStub } from '../../contracts/result-where/result-where.stub';
import { StepIndexStub } from '../../contracts/step-index/step-index.stub';
import { StepReadingStub } from '../../contracts/step-reading/step-reading.stub';
import { serverWindowCoverTransformer } from './server-window-cover-transformer';

describe('serverWindowCoverTransformer', () => {
  it('VALID: {step: null, where: null} => spans every step in the run', () => {
    const readings = [
      StepReadingStub({
        step: StepIndexStub({ value: 1 }),
        serverWindow: { fromByte: 10, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 2 }),
        serverWindow: { fromByte: 40, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 3 }),
        serverWindow: { fromByte: 40, toByte: 90 },
      }),
    ];

    expect(serverWindowCoverTransformer({ readings, step: null, where: null })).toStrictEqual({
      fromByte: 10,
      toByte: 90,
    });
  });

  it('VALID: {step: 2} => only that step window', () => {
    const readings = [
      StepReadingStub({
        step: StepIndexStub({ value: 1 }),
        serverWindow: { fromByte: 10, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 2 }),
        serverWindow: { fromByte: 40, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 3 }),
        serverWindow: { fromByte: 40, toByte: 90 },
      }),
    ];

    expect(
      serverWindowCoverTransformer({ readings, step: StepIndexStub({ value: 2 }), where: null }),
    ).toStrictEqual({ fromByte: 40, toByte: 40 });
  });

  it('VALID: {where.steps: 1-2} => spans the range', () => {
    const readings = [
      StepReadingStub({
        step: StepIndexStub({ value: 1 }),
        serverWindow: { fromByte: 10, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 2 }),
        serverWindow: { fromByte: 40, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 3 }),
        serverWindow: { fromByte: 40, toByte: 90 },
      }),
    ];

    expect(
      serverWindowCoverTransformer({
        readings,
        step: null,
        where: ResultWhereStub({ steps: '1-2' }),
      }),
    ).toStrictEqual({ fromByte: 10, toByte: 40 });
  });

  it('EMPTY: {a step no reading has} => returns null', () => {
    const readings = [
      StepReadingStub({
        step: StepIndexStub({ value: 1 }),
        serverWindow: { fromByte: 10, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 2 }),
        serverWindow: { fromByte: 40, toByte: 40 },
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 3 }),
        serverWindow: { fromByte: 40, toByte: 90 },
      }),
    ];

    expect(
      serverWindowCoverTransformer({ readings, step: StepIndexStub({ value: 9 }), where: null }),
    ).toBe(null);
  });
});
