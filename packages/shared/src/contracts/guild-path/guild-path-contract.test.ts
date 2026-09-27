import { guildPathContract } from './guild-path-contract';
import { GuildPathStub } from './guild-path.stub';

describe('guildPathContract', () => {
  it('VALID: {value: "/home/user/my-guild"} => parses successfully', () => {
    const path = GuildPathStub({ value: '/home/user/my-guild' });

    expect(path).toBe('/home/user/my-guild');
  });

  it('VALID: {default value} => uses default path', () => {
    const path = GuildPathStub();

    expect(path).toBe('/home/user/my-guild');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return guildPathContract.parse('');
    }).toThrow(/expected string to have >=1 characters/u);
  });
});
