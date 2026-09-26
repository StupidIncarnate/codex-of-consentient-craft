import { readItem, writeItem, removeItem, keys } from './index';

describe('@dungeonmaster/browser/localStorage', () => {
  it('VALID: {barrel} => re-exports every curated localStorage function', () => {
    expect(readItem).toStrictEqual(expect.any(Function));
    expect(writeItem).toStrictEqual(expect.any(Function));
    expect(removeItem).toStrictEqual(expect.any(Function));
    expect(keys).toStrictEqual(expect.any(Function));
  });
});
