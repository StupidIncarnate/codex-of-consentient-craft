import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { smoketestSubstituteWorkItemPlaceholdersTransformer } from './smoketest-substitute-work-item-placeholders-transformer';

const QUEST_ID = QuestIdStub({ value: 'f1f1f1f1-1111-4111-8111-111111111111' });
const GUILD_ID = GuildIdStub({ value: 'a2a2a2a2-2222-4222-8222-222222222222' });
const PROCESS_ID = ProcessIdStub({ value: 'proc-c3c3c3c3' });

describe('smoketestSubstituteWorkItemPlaceholdersTransformer', () => {
  it('VALID: {workItem with {{questId}} placeholder} => substitutes live questId', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: 'Call get-quest with questId={{questId}}.',
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

  // Resolved per ITEM, off the item's own id — unlike the other three, which are run-wide. It is
  // the one token nothing else could supply: signal-back requires it and a scripted agent's whole
  // context is its one-line prompt.
  it('VALID: {workItem with {{workItemId}} placeholder} => substitutes that item OWN id', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: 'signal-back {"workItemId":"{{workItemId}}"}',
    });

    const [updated] = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [wi],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated?.smoketestPromptOverride).toBe(`signal-back {"workItemId":"${String(wi.id)}"}`);
  });

  it('VALID: {two work items sharing one {{workItemId}} prompt} => each resolves to its OWN id, never the first', () => {
    const first = WorkItemStub({
      id: QuestWorkItemIdStub({ value: '11111111-1111-4111-8111-111111111111' }),
      smoketestPromptOverride: 'wi={{workItemId}}',
    });
    const second = WorkItemStub({
      id: QuestWorkItemIdStub({ value: '22222222-2222-4222-8222-222222222222' }),
      smoketestPromptOverride: 'wi={{workItemId}}',
    });

    const updated = smoketestSubstituteWorkItemPlaceholdersTransformer({
      workItems: [first, second],
      questId: QUEST_ID,
      guildId: GUILD_ID,
      processId: PROCESS_ID,
    });

    expect(updated.map((wi) => wi.smoketestPromptOverride)).toStrictEqual([
      'wi=11111111-1111-4111-8111-111111111111',
      'wi=22222222-2222-4222-8222-222222222222',
    ]);
  });

  it('VALID: {workItem with {{guildId}} placeholder} => substitutes live guildId', () => {
    const wi = WorkItemStub({
      smoketestPromptOverride: 'list-quests {"guildId":"{{guildId}}"}',
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
      smoketestPromptOverride: 'q={{questId}} g={{guildId}}',
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
      smoketestPromptOverride: 'no placeholders here',
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
      smoketestPromptOverride: 'get-quest-status {"processId":"{{processId}}"}',
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
      smoketestPromptOverride: 'q={{questId}} g={{guildId}} p={{processId}}',
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
      smoketestPromptOverride: 'a={{questId}} b={{questId}} c={{guildId}}',
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
