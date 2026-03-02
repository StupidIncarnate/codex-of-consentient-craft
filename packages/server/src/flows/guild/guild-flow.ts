/**
 * PURPOSE: Creates a Hono sub-app with guild CRUD routes that delegate to guild responders
 *
 * USAGE:
 * const guildApp = GuildFlow();
 * app.route('', guildApp);
 * // Registers GET/POST /api/guilds and GET/PATCH/DELETE /api/guilds/:guildId
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { GuildListResponder } from '../../responders/guild/list/guild-list-responder';
import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { GuildGetResponder } from '../../responders/guild/get/guild-get-responder';
import { GuildUpdateResponder } from '../../responders/guild/update/guild-update-responder';
import { GuildRemoveResponder } from '../../responders/guild/remove/guild-remove-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const GuildFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.guilds.list, async (c) => {
    const result = await GuildListResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.guilds.list, async (c) => {
    const result = await GuildAddResponder({ body: await c.req.json() });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildGetResponder({ params: { guildId: c.req.param('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.patch(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildUpdateResponder({
      params: { guildId: c.req.param('guildId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.delete(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildRemoveResponder({ params: { guildId: c.req.param('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
