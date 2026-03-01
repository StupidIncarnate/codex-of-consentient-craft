/**
 * PURPOSE: Orchestrates guild operations by delegating to guild responders
 *
 * USAGE:
 * const guild = await GuildFlow.add({ name, path });
 * const guild = await GuildFlow.get({ guildId });
 * const items = await GuildFlow.list();
 * await GuildFlow.remove({ guildId });
 * const updated = await GuildFlow.update({ guildId, name, path });
 */

import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { GuildGetResponder } from '../../responders/guild/get/guild-get-responder';
import { GuildListResponder } from '../../responders/guild/list/guild-list-responder';
import { GuildRemoveResponder } from '../../responders/guild/remove/guild-remove-responder';
import { GuildUpdateResponder } from '../../responders/guild/update/guild-update-responder';

type AddParams = Parameters<typeof GuildAddResponder>[0];
type AddResult = Awaited<ReturnType<typeof GuildAddResponder>>;

type GetParams = Parameters<typeof GuildGetResponder>[0];
type GetResult = Awaited<ReturnType<typeof GuildGetResponder>>;

type ListResult = Awaited<ReturnType<typeof GuildListResponder>>;

type RemoveParams = Parameters<typeof GuildRemoveResponder>[0];
type RemoveResult = Awaited<ReturnType<typeof GuildRemoveResponder>>;

type UpdateParams = Parameters<typeof GuildUpdateResponder>[0];
type UpdateResult = Awaited<ReturnType<typeof GuildUpdateResponder>>;

export const GuildFlow = {
  add: async ({ name, path }: AddParams): Promise<AddResult> => GuildAddResponder({ name, path }),

  get: async ({ guildId }: GetParams): Promise<GetResult> => GuildGetResponder({ guildId }),

  list: async (): Promise<ListResult> => GuildListResponder(),

  remove: async ({ guildId }: RemoveParams): Promise<RemoveResult> =>
    GuildRemoveResponder({ guildId }),

  update: async ({ guildId, name, path }: UpdateParams): Promise<UpdateResult> =>
    GuildUpdateResponder({
      guildId,
      ...(name !== undefined && { name }),
      ...(path !== undefined && { path }),
    }),
};
