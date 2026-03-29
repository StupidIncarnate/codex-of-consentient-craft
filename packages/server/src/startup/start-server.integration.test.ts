import { StartServer } from './start-server';

describe('StartServer', () => {
  it('VALID: {export} => StartServer is a function', () => {
    expect(StartServer).toStrictEqual(expect.any(Function));
  });
});
