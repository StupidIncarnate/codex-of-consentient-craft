import { holdReadingContract } from './hold-reading-contract';
import { HoldReadingStub } from './hold-reading.stub';

describe('holdReadingContract', () => {
  it('VALID: {default stub} => parses exact HoldReading shape', () => {
    const reading = HoldReadingStub();

    const result = holdReadingContract.parse(reading);

    expect(result).toStrictEqual({
      frames: 4,
      differing: 0,
      verdict: 'NOTHING CHANGED across 4.5s',
      shots: [
        '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1_frame1.png',
        '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1_frame2.png',
      ],
    });
  });

  it('INVALID: {frames < minFrames} => throws validation error', () => {
    expect(() => {
      holdReadingContract.parse({
        frames: 1,
        differing: 0,
        verdict: 'NOTHING CHANGED across 1.5s',
        shots: [],
      });
    }).toThrow(/Number must be greater than or equal to 2/u);
  });

  it('INVALID: {differing < 0} => throws validation error', () => {
    expect(() => {
      holdReadingContract.parse({
        frames: 4,
        differing: -1,
        verdict: 'NOTHING CHANGED across 4.5s',
        shots: [],
      });
    }).toThrow(/Number must be greater than or equal to 0/u);
  });

  it('INVALID: {unrecognized key} => throws strict validation error', () => {
    expect(() => {
      holdReadingContract.parse({
        frames: 4,
        differing: 0,
        verdict: 'NOTHING CHANGED across 4.5s',
        shots: [],
        extraKey: 'invalid',
      });
    }).toThrow(/Unrecognized key/u);
  });
});
