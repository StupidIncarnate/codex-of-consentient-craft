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

  it('INVALID_NAME: {value: ""} => throws validation error', () => {
    expect(() => {
      return guildNameContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_NAME: {value: 101 chars} => throws validation error', () => {
    const tooLong = 'a'.repeat(101);

    expect(() => {
      return guildNameContract.parse(tooLong);
    }).toThrow(/String must contain at most 100 character/u);
  });
});
