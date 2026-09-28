import { guildNameContract } from './guild-name-contract';
import { GuildNameStub } from './guild-name.stub';

describe('guildNameContract', () => {
  it('VALID: {value: "My Guild"} => parses successfully', () => {
    const name = GuildNameStub({ value: 'My Guild' });

    expect(name).toBe('My Guild');
  });

  it('VALID: {default value} => uses default name', () => {
    const name = GuildNameStub();

    expect(name).toBe('My Guild');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return guildNameContract.parse('');
    }).toThrow(/expected string to have >=1 characters/u);
  });

  it('INVALID: {value: 101 chars} => throws validation error', () => {
    const tooLong = 'a'.repeat(101);

    expect(() => {
      return guildNameContract.parse(tooLong);
    }).toThrow(/Too big: expected string to have <=100 characters/u);
  });
});
