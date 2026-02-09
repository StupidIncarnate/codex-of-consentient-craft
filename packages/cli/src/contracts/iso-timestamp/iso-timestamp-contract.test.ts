import { isoTimestampContract } from './iso-timestamp-contract';
import { IsoTimestampStub } from './iso-timestamp.stub';

type IsoTimestamp = ReturnType<typeof IsoTimestampStub>;

describe('isoTimestampContract', () => {
  it('VALID: ISO date string => parses successfully', () => {
    const result: IsoTimestamp = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

    expect(isoTimestampContract.parse(result)).toBe('2024-01-15T10:00:00.000Z');
  });
});
