import { activeQuestEntryContract } from './active-quest-entry-contract';
import { ActiveQuestEntryStub } from './active-quest-entry.stub';

describe('activeQuestEntryContract', () => {
  it('VALID: {full entry} => parses to the same shape', () => {
    const entry = ActiveQuestEntryStub();

    expect(activeQuestEntryContract.parse(entry)).toStrictEqual(entry);
  });

  it('INVALID: {missing guildSlug} => throws', () => {
    const { quest, guildId } = ActiveQuestEntryStub();

    expect(() => activeQuestEntryContract.parse({ quest, guildId })).toThrow(/Required/u);
  });
});
