import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { createQuestOutputContract } from './create-quest-output-contract';
import { CreateQuestOutputStub } from './create-quest-output.stub';

describe('createQuestOutputContract', () => {
  it('VALID: {questId, guildSlug} => parses successfully', () => {
    const result = createQuestOutputContract.parse(CreateQuestOutputStub());

    expect(result).toStrictEqual({
      questId: 'aaaaaaaa-1111-4222-9333-444444444444',
      guildSlug: 'my-guild',
    });
  });

  it('VALID: {custom questId and slug} => parses successfully', () => {
    const questId = QuestIdStub({ value: 'feature-x' });
    const guildSlug = 'another-guild';

    const result = createQuestOutputContract.parse({ questId, guildSlug });

    expect(result).toStrictEqual({ questId, guildSlug });
  });

  it('INVALID: {missing questId} => throws Required', () => {
    expect(() =>
      createQuestOutputContract.parse({ guildSlug: 'g' }),
    ).toThrow(/received undefined/u);
  });

  it('INVALID: {missing guildSlug} => throws Required', () => {
    expect(() =>
      createQuestOutputContract.parse({ questId: QuestIdStub({ value: 'q1' }) }),
    ).toThrow(/received undefined/u);
  });

  it('INVALID: {guildSlug with spaces} => throws regex error', () => {
    expect(() =>
      createQuestOutputContract.parse({
        questId: QuestIdStub({ value: 'q1' }),
        guildSlug: 'My Guild',
      }),
    ).toThrow(/Invalid/u);
  });

  it('INVALID: {unknown key} => throws Unrecognized key error', () => {
    expect(() =>
      createQuestOutputContract.parse({
        questId: QuestIdStub({ value: 'q1' }),
        guildSlug: 'g',
        extra: 'stuff',
      }),
    ).toThrow(/Unrecognized key/u);
  });
});
