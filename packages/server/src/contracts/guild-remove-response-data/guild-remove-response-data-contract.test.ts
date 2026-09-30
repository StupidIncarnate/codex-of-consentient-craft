import { guildRemoveResponseDataContract } from './guild-remove-response-data-contract';
import { GuildRemoveResponseDataStub } from './guild-remove-response-data.stub';

describe('guildRemoveResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = GuildRemoveResponseDataStub();

    expect(guildRemoveResponseDataContract.parse(result)).toStrictEqual({ success: true });
  });

  it('INVALID: {success: yes} => throws validation error', () => {
    expect(() => guildRemoveResponseDataContract.parse({ success: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => guildRemoveResponseDataContract.parse({ success: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
