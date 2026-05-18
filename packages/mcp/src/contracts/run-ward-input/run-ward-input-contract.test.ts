import { runWardInputContract } from './run-ward-input-contract';
import { RunWardInputStub } from './run-ward-input.stub';

describe('runWardInputContract', () => {
  it('VALID: {questId, workItemId, mode: "changed"} => parses successfully', () => {
    const input = RunWardInputStub({ mode: 'changed' });

    const result = runWardInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('VALID: {questId, workItemId, mode: "full"} => parses successfully', () => {
    const input = RunWardInputStub({ mode: 'full' });

    const result = runWardInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('INVALID: {missing questId} => throws', () => {
    expect(() =>
      runWardInputContract.parse({
        workItemId: 'aaaaaaaa-1111-4222-9333-444444444444',
        mode: 'changed',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing workItemId} => throws', () => {
    expect(() =>
      runWardInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        mode: 'changed',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {mode: "partial"} => throws', () => {
    expect(() =>
      runWardInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        mode: 'partial',
      }),
    ).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {extra key} => throws (strict)', () => {
    expect(() =>
      runWardInputContract.parse({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        mode: 'changed',
        extra: 'no',
      }),
    ).toThrow(/Unrecognized key/u);
  });
});
