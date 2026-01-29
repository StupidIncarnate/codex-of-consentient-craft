import { pollUntilMatchTransformer } from './poll-until-match-transformer';
import { FileNameStub } from '../../contracts/file-name/file-name.stub';

describe('pollUntilMatchTransformer', () => {
  it('VALID: {immediate match} => returns result immediately', async () => {
    const expectedValue = FileNameStub({ value: 'found' });

    const result = await pollUntilMatchTransformer({
      check: () => expectedValue,
      interval: 10,
      timeout: 100,
      timeoutMessage: 'Not found',
    });

    expect(result).toBe(expectedValue);
  });

  it('VALID: {match on second check} => returns result after polling', async () => {
    let callCount = 0;
    const expectedValue = FileNameStub({ value: 'found' });
    const returnValues = [null, expectedValue];

    const result = await pollUntilMatchTransformer({
      check: () => {
        const value = returnValues[callCount];
        callCount++;
        return value;
      },
      interval: 10,
      timeout: 1000,
      timeoutMessage: 'Not found',
    });

    expect(result).toBe(expectedValue);
    expect(callCount).toBe(2);
  });

  it('INVALID: {no match before timeout} => throws timeout error', async () => {
    await expect(
      pollUntilMatchTransformer({
        check: () => null,
        interval: 10,
        timeout: 50,
        timeoutMessage: 'Custom timeout message',
      }),
    ).rejects.toThrow('Custom timeout message');
  });
});
