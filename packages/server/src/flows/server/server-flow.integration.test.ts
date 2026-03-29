import { ServerFlow } from './server-flow';

describe('ServerFlow', () => {
  it('VALID: {export} => ServerFlow is a function', () => {
    expect(ServerFlow).toStrictEqual(expect.any(Function));
  });
});
