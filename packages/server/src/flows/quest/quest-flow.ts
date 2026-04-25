/**
 * PURPOSE: Creates a Hono sub-app with quest routes that delegate to quest responders
 *
 * USAGE:
 * const questApp = QuestFlow();
 * app.route('', questApp);
 * // Registers GET/POST /api/quests, GET/PATCH /api/quests/:questId, POST start and pause
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestsQueueResponder } from '../../responders/quests/queue/quests-queue-responder';
import { QuestAbandonResponder } from '../../responders/quest/abandon/quest-abandon-responder';
import { QuestUserAddResponder } from '../../responders/quest/user-add/quest-user-add-responder';
import { QuestDeleteResponder } from '../../responders/quest/delete/quest-delete-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { QuestPauseResponder } from '../../responders/quest/pause/quest-pause-responder';
import { QuestResumeResponder } from '../../responders/quest/resume/quest-resume-responder';
import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const QuestFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.quests.list, async (c) => {
    const result = await QuestListResponder({ query: { guildId: c.req.query('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.quests.queue, async (c) => {
    const result = await QuestsQueueResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.quests.byId, async (c) => {
    const result = await QuestGetResponder({
      params: { questId: c.req.param('questId') },
      query: { stage: c.req.query('stage') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.quests.list, async (c) => {
    const result = await QuestUserAddResponder({ body: await c.req.json() });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.patch(apiRoutesStatics.quests.byId, async (c) => {
    const result = await QuestModifyResponder({
      params: { questId: c.req.param('questId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.quests.start, async (c) => {
    const result = await QuestStartResponder({ params: { questId: c.req.param('questId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.quests.pause, async (c) => {
    const result = await QuestPauseResponder({ params: { questId: c.req.param('questId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.quests.resume, async (c) => {
    const result = await QuestResumeResponder({ params: { questId: c.req.param('questId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.quests.abandon, async (c) => {
    const result = await QuestAbandonResponder({ params: { questId: c.req.param('questId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.delete(apiRoutesStatics.quests.delete, async (c) => {
    const result = await QuestDeleteResponder({
      params: { questId: c.req.param('questId') },
      query: { guildId: c.req.query('guildId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
