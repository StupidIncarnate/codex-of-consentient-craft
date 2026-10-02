import { openSqliteDatabase, NodeVersionUnsupportedError } from './sqlite';

describe('#gateway/node/sqlite', () => {
  it('VALID: {barrel} => re-exports openSqliteDatabase and NodeVersionUnsupportedError', () => {
    expect(openSqliteDatabase).toStrictEqual(expect.any(Function));
    expect(NodeVersionUnsupportedError).toStrictEqual(expect.any(Function));
  });
});
