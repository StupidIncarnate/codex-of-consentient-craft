import { guildListResponseDataContract } from './guild-list-response-data-contract';
import { GuildListResponseDataStub } from './guild-list-response-data.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';

describe('guildListResponseDataContract', () => {
  it('VALID: {default stub} => parses one guild list item', () => {
    const result = GuildListResponseDataStub();

    expect(guildListResponseDataContract.parse(result)).toStrictEqual([GuildListItemStub()]);
  });

  it('INVALID: {object instead of array} => throws validation error', () => {
    expect(() => guildListResponseDataContract.parse({})).toThrow(
      /expected array, received object/u,
    );
  });
});
