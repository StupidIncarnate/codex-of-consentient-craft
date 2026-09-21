import { runWardInputContract } from './run-ward-input-contract';
import { RunWardInputStub } from './run-ward-input.stub';

describe('runWardInputContract', () => {
  it('VALID: {questId, workItemId} => parses successfully', () => {
    const input = RunWardInputStub();

    const result = runWardInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('INVALID: {missing questId} => throws', () => {
    expect(() =>
      runWardInputContract.parse({
        workItemId: 'aaaaaaaa-1111-4222-9333-444444444444',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing workItemId} => throws', () => {
    expect(() =>
      runWardInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {mode: "committed"} => throws (strict), because a ward run carries no scope argument', () => {
    expect(() =>
      runWardInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        mode: 'committed',
      }),
    ).toThrow(/Unrecognized key/u);
  });

  it('INVALID: {extra key} => throws (strict)', () => {
    expect(() =>
      runWardInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        extra: 'no',
      }),
    ).toThrow(/Unrecognized key/u);
  });
});
