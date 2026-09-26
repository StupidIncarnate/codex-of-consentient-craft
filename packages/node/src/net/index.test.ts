import { isPortFree, freePortPair, unixSocketRequest, unixSocketServe } from './index';

describe('@dungeonmaster/node/net', () => {
  it('VALID: {barrel} => re-exports every curated net function', () => {
    expect(isPortFree).toStrictEqual(expect.any(Function));
    expect(freePortPair).toStrictEqual(expect.any(Function));
    expect(unixSocketRequest).toStrictEqual(expect.any(Function));
    expect(unixSocketServe).toStrictEqual(expect.any(Function));
  });
});
