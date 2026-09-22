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
 * `questReachRouteBroker`, the SAME transition machinery a plain `set()` op already uses. A status
 * the real gates refuse (missing flow/observable content, or a status excluded from
 * `transitions.to` entirely) throws THAT gate's own named error rather than leaving the quest
 * silently at `created`.
 *
 * Returns the created quest record itself on a success status, never `dmHttpRequestAdapter`'s
 * `{ status, body }` envelope — the runner parses whatever this route returns straight through
 * `questContract`, and that contract can never accept an envelope. `dmHttpResponseUnwrapAdapter` is
 * what makes a failure status hold too, by throwing instead of handing the envelope onward.
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

  const postResponse = await dmHttpRequestAdapter({
    target,
    method: 'POST',
    path: QUESTS_PATH,
    body: {
      guildId: parsedFields.guildId,
      title: parsedFields.title,
      userRequest: parsedFields.userRequest,
    },
  });

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

  const getResponse = await dmHttpRequestAdapter({
    target,
    method: 'GET',
    path: getPath,
  });

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
  });
};
