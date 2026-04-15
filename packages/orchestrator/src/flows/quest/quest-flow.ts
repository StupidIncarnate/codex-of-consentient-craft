/**
 * PURPOSE: Orchestrates quest operations by delegating to quest responders
 *
 * USAGE:
 * const result = await QuestFlow.add({ title, userRequest, guildId });
 * const quest = await QuestFlow.get({ questId, stage });
 * const items = await QuestFlow.list({ guildId });
 * const fullQuest = await QuestFlow.load({ questId });
 * const modified = await QuestFlow.modify({ questId, input });
 * const notes = await QuestFlow.getPlanningNotes({ questId });
 */

import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestGetPlanningNotesResponder } from '../../responders/quest/get-planning-notes/quest-get-planning-notes-responder';
import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
import { QuestLoadResponder } from '../../responders/quest/load/quest-load-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';

type AddParams = Parameters<typeof QuestAddResponder>[0];
type AddResult = Awaited<ReturnType<typeof QuestAddResponder>>;

type GetParams = Parameters<typeof QuestGetResponder>[0];
type GetResult = Awaited<ReturnType<typeof QuestGetResponder>>;

type GetPlanningNotesParams = Parameters<typeof QuestGetPlanningNotesResponder>[0];
type GetPlanningNotesResult = Awaited<ReturnType<typeof QuestGetPlanningNotesResponder>>;

type ListParams = Parameters<typeof QuestListResponder>[0];
type ListResult = Awaited<ReturnType<typeof QuestListResponder>>;

type LoadParams = Parameters<typeof QuestLoadResponder>[0];
type LoadResult = Awaited<ReturnType<typeof QuestLoadResponder>>;

type ModifyParams = Parameters<typeof QuestModifyResponder>[0];
type ModifyResult = Awaited<ReturnType<typeof QuestModifyResponder>>;

export const QuestFlow = {
  add: async ({ title, userRequest, guildId }: AddParams): Promise<AddResult> =>
    QuestAddResponder({ title, userRequest, guildId }),

  get: async ({ questId, stage }: GetParams): Promise<GetResult> =>
    QuestGetResponder({ questId, ...(stage !== undefined && { stage }) }),

  getPlanningNotes: async ({
    questId,
    section,
  }: GetPlanningNotesParams): Promise<GetPlanningNotesResult> =>
    QuestGetPlanningNotesResponder({ questId, ...(section !== undefined && { section }) }),

  list: async ({ guildId }: ListParams): Promise<ListResult> => QuestListResponder({ guildId }),

  load: async ({ questId }: LoadParams): Promise<LoadResult> => QuestLoadResponder({ questId }),

  modify: async ({ questId, input }: ModifyParams): Promise<ModifyResult> =>
    QuestModifyResponder({ questId, input }),
};
