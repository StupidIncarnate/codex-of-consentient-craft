import { runRiftcarverInputContract } from './run-riftcarver-input-contract';
import { RunRiftcarverInputStub } from './run-riftcarver-input.stub';

describe('runRiftcarverInputContract', () => {
  it('VALID: {questId, workItemId} => parses successfully', () => {
    const input = RunRiftcarverInputStub();

    const result = runRiftcarverInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('INVALID: {missing questId} => throws', () => {
    expect(() =>
      runRiftcarverInputContract.parse({
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing workItemId} => throws', () => {
    expect(() =>
      runRiftcarverInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {mode: "changed"} => throws (strict — riftcarver has no mode)', () => {
    expect(() =>
      runRiftcarverInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        mode: 'changed',
      }),
    ).toThrow(/Unrecognized key/u);
  });

  it('INVALID: {extra key} => throws (strict)', () => {
    expect(() =>
      runRiftcarverInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        extra: 'no',
      }),
    ).toThrow(/Unrecognized key/u);
  });
});
