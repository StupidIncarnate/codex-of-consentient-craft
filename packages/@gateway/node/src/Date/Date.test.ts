import { now } from './Date';

describe('#gateway/node/Date', () => {
  it('VALID: {now} => the barrel re-exports the wrapper as a function', () => {
    expect(now).toStrictEqual(expect.any(Function));
  });
});
