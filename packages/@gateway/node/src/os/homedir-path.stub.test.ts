import { homedir } from 'os';
import { HomedirPathStub } from './homedir-path.stub';

describe('HomedirPathStub', () => {
  it('VALID: {} => returns the same real path Node itself reports as the home directory', () => {
    expect(HomedirPathStub()).toBe(homedir());
  });
});
