import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../contracts/prompt-text/prompt-text.stub';
import { smoketestSubstituteWorkItemPlaceholdersTransformer } from './smoketest-substitute-work-item-placeholders-transformer';

const QUEST_ID = QuestIdStub({ value: 'f1f1f1f1-1111-4111-8111-111111111111' });
const GUILD_ID = GuildIdStub({ value: 'a2a2a2a2-2222-4222-8222-222222222222' });
const PROCESS_ID = ProcessIdStub({ value: 'proc-c3c3c3c3' });

describe('smoketestSubstituteWorkItemPlaceholdersTransformer', () => {
  it('VALID: {workItem with {{questId}} placeholder} => substitutes live questId', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({
        value: 'Call get-quest with questId={{questId}}.',
      }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(
      `Call get-quest with questId=${String(QUEST_ID)}.`,
    );
  });

  it('VALID: {workItem with {{guildId}} placeholder} => substitutes live guildId', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({
        value: 'list-quests {"guildId":"{{guildId}}"}',
      }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(`list-quests {"guildId":"${String(GUILD_ID)}"}`);
  });

  it('VALID: {workItem with both placeholders} => substitutes both', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({ value: 'q={{questId}} g={{guildId}}' }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(`q=${String(QUEST_ID)} g=${String(GUILD_ID)}`);
  });

  it('VALID: {workItem with no placeholder} => returns same reference', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({ value: 'no placeholders here' }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated).toBe(wi);
  });

  it('VALID: {workItem with no override} => returns same reference', () => {
    const wi = WorkItemStub();

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated).toBe(wi);
  });

  it('VALID: {workItem with {{processId}} placeholder} => substitutes live processId', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({
        value: 'get-quest-status {"processId":"{{processId}}"}',
      }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(
      `get-quest-status {"processId":"${String(PROCESS_ID)}"}`,
    );
  });

  it('VALID: {workItem with all three placeholders} => substitutes all', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({
        value: 'q={{questId}} g={{guildId}} p={{processId}}',
      }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(
      `q=${String(QUEST_ID)} g=${String(GUILD_ID)} p=${String(PROCESS_ID)}`,
    );
  });

  it('VALID: {multiple placeholder occurrences} => substitutes all of them', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: PromptTextStub({
        value: 'a={{questId}} b={{questId}} c={{guildId}}',
      }),
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(
      `a=${String(QUEST_ID)} b=${String(QUEST_ID)} c=${String(GUILD_ID)}`,
    );
  });
});
