/**
 * PURPOSE: The quest ingredient's `api` route — `POST /api/quests` with `{ guildId, title,
 * userRequest }`, parsed through addQuestResultContract, then `GET /api/quests/:id` for the record.
 * Reach for this over the `write` route in an end-to-end spec: it walks the real intake path
 * (`questUserAddBroker` mints the id, seeds the chat work item, and the quest starts at `created`),
 * so it cannot express an arbitrary seeded `status`/`workItems`/`operations` the way `write` can —
 * that asymmetry is the whole reason both routes exist.
 *
 * Returns the created quest record itself on a success status, never `dmHttpRequestAdapter`'s
 * `{ status, body }` envelope — the runner parses whatever this route returns straight through
 * `questContract`, and that contract can never accept an envelope. `dmHttpResponseUnwrapAdapter` is
 * what makes a failure status hold too, by throwing instead of handing the envelope onward.
 *
 * USAGE:
 * await questApiRouteBroker({ target, fields: { guildId, title, userRequest } });
 * // Returns an AddQuestResult-shaped record on a success status; throws naming the url, status and
 * // body otherwise
 */
import { dmHttpRequestAdapter } from '../../../adapters/dm-http/request/dm-http-request-adapter';
import { dmHttpResponseUnwrapAdapter } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
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
  return questContract.parse(quest);
};
