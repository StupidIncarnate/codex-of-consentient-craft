import { isoTimestampContract } from './iso-timestamp-contract';
import { IsoTimestampStub } from './iso-timestamp.stub';

describe('isoTimestampContract', () => {
  it('VALID: ISO string => parses successfully', () => {
    const result = IsoTimestampStub({ value: '2024-01-01T00:00:00.000Z' });

    expect(isoTimestampContract.parse(result)).toBe('2024-01-01T00:00:00.000Z');
  });
});
