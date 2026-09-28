/**
 * PURPOSE: The quest ingredient's `api` route — `POST /api/quests` with `{ guildId, title,
 * userRequest }`, parsed through addQuestResultContract, then `GET /api/quests/:id` for the record.
 * Reach for this over the `write` route in an end-to-end spec: it walks the real intake path
 * (`questUserAddBroker` mints the id, seeds the chat work item, and the quest starts at `created`),
 * so it cannot express an arbitrary seeded `workItems`/`operations` the way `write` can — that
 * asymmetry is the whole reason both routes exist.
 *
 * `POST /api/quests` never accepts a `status` field on the wire — `quest-create-broker.ts` mints
 * every quest at `created` unconditionally — so this route never puts one on it either. A caller's
 * `fields.status` is still honored: once the create-plus-reload round trip confirms the status the
 * server actually minted, a request for anything else is walked there through
 * `questReachRouteBroker`, the SAME transition machinery a plain `set()` op already uses — carrying
 * the WHOLE parsed `fields` along as `extraFields`, so a recipe's own `flows`/`designDecisions`/
 * `packagesAffected` (also never read off the create wire) reach the live quest through a real
 * modify call the moment the walk allows them, rather than being silently dropped the way they were
 * before this route carried them forward. A status the real gates still refuse (no content supplied
 * at all, or a status excluded from `transitions.to` entirely) throws THAT gate's own named error
 * rather than leaving the quest silently at `created`.
 *
 * Returns the created quest record itself on a success status, never `dmHttpRequestAdapter`'s
 * `{ status, body }` envelope — the runner parses whatever this route returns straight through
 * `questContract`, and that contract can never accept an envelope. `dmHttpResponseUnwrapAdapter` is
 * what makes a failure status hold too, by throwing instead of handing the envelope onward. A
 * transport failure — `dmHttpRequestAdapter`'s own `fetch` rejecting before any status exists — is
 * caught and re-thrown through `dmHttpTransportFailureTransformer` so `routeFailureTransformer` can
 * still mine a `url` off it: `dmHttpRequestAdapter` attaches none itself (its raw `fetch` call has no
 * try/catch), unlike the framework's own `fetchPostAdapter`, which this repo's routes do not call.
 *
 * USAGE:
 * await questApiRouteBroker({ target, fields: { guildId, title, userRequest, status: 'created' } });
 * // Returns an AddQuestResult-shaped record on a success status; throws naming the url, status and
 * // body otherwise — or, for a `status` other than `created`, whatever `questReachRouteBroker`
 * // threw walking there
 */
import { dmHttpRequestAdapter } from '../../../adapters/dm-http/request/dm-http-request-adapter';
import { dmHttpResponseUnwrapAdapter } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmHttpTransportFailureTransformer } from '../../../transformers/dm-http-transport-failure/dm-http-transport-failure-transformer';
import { questReachRouteBroker } from '../reach-route/quest-reach-route-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';
import { addQuestResultContract, questContract } from '@dungeonmaster/shared/contracts';

const QUESTS_PATH = '/api/quests';

export const questApiRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<unknown> => {
  const parsedFields = questFieldsContract.parse(fields);
  const url = target.baseUrl === undefined ? QUESTS_PATH : `${target.baseUrl}${QUESTS_PATH}`;

  const postResponse = await (async (): ReturnType<typeof dmHttpRequestAdapter> => {
    try {
      return await dmHttpRequestAdapter({
        target,
        method: 'POST',
        path: QUESTS_PATH,
        body: {
          guildId: parsedFields.guildId,
          title: parsedFields.title,
          userRequest: parsedFields.userRequest,
        },
      });
    } catch (cause) {
      throw dmHttpTransportFailureTransformer({ cause, url });
    }
  })();

  const addResult = dmHttpResponseUnwrapAdapter({
    response: postResponse,
    url,
  });

  const parsedAddResult = addQuestResultContract.parse(addResult);
  if (!parsedAddResult.questId) {
    throw new Error('questApiRouteBroker: Expected addResult to have questId');
  }

  const getPath = `${QUESTS_PATH}/${parsedAddResult.questId}`;
  const getUrl = target.baseUrl === undefined ? getPath : `${target.baseUrl}${getPath}`;

  const getResponse = await (async (): ReturnType<typeof dmHttpRequestAdapter> => {
    try {
      return await dmHttpRequestAdapter({
        target,
        method: 'GET',
        path: getPath,
      });
    } catch (cause) {
      throw dmHttpTransportFailureTransformer({ cause, url: getUrl });
    }
  })();

  const getResult = dmHttpResponseUnwrapAdapter({
    response: getResponse,
    url: getUrl,
  });

  const { quest } = getResult as Record<PropertyKey, unknown>;
  const createdQuest = questContract.parse(quest);

  if (parsedFields.status === createdQuest.status) {
    return createdQuest;
  }

  return questReachRouteBroker({
    from: createdQuest.status,
    to: parsedFields.status,
    target,
    record: createdQuest,
    // Carries `flows`/`designDecisions`/`packagesAffected` over from the recipe's own fields — the
    // real create endpoint never reads them off the wire, so without this a live target's walk
    // would hit the exact same gate a `write` target's direct record write never has to clear.
    extraFields: parsedFields,
  });
};
