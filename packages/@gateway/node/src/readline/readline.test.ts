import { question, lineReader } from './readline';

describe('#gateway/node/readline', () => {
  it('VALID: {barrel} => re-exports every curated readline function', () => {
    expect(question).toStrictEqual(expect.any(Function));
    expect(lineReader).toStrictEqual(expect.any(Function));
  });
});
