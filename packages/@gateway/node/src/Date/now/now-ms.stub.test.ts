import { NowMsStub } from './now-ms.stub';

describe('NowMsStub', () => {
  it('VALID: {} => the default instant, 2024-01-01T00:00:00.000Z', () => {
    expect(NowMsStub()).toBe(1_704_067_200_000);
  });

  it('VALID: {iso} => the epoch milliseconds of that instant', () => {
    expect(NowMsStub({ iso: '1970-01-01T00:00:01.000Z' })).toBe(1000);
  });
});
