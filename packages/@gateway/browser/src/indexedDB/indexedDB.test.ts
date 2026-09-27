import { openStore, getAll, put, deleteRecord } from './indexedDB';

describe('#gateway/browser/indexedDB', () => {
  it('VALID: {barrel} => re-exports every curated indexedDB function', () => {
    expect(openStore).toStrictEqual(expect.any(Function));
    expect(getAll).toStrictEqual(expect.any(Function));
    expect(put).toStrictEqual(expect.any(Function));
    expect(deleteRecord).toStrictEqual(expect.any(Function));
  });
});
