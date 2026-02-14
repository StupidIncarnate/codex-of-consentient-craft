import { guildIdContract } from './guild-id-contract';
import { GuildIdStub } from './guild-id.stub';

describe('guildIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = GuildIdStub();

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return guildIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return guildIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
