import { StartServer } from './index.js';

describe('server index', () => {
  it('VALID: {import} => exports StartServer as a function', () => {
    expect(StartServer).toStrictEqual(expect.any(Function));
  });
});
