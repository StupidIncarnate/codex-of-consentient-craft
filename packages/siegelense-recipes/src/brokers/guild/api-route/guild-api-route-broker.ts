/**
 * PURPOSE: The guild ingredient's `api` route — `POST /api/guilds` through the real server
 * handler. Reach for `guildPathDeriveTransformer` here too, exactly as the `write` route does:
 * without it, a caller who never sets an explicit `path` would send the RELATIVE fragment
 * `defaults(index)` minted straight over the wire, and the api-created guild's `path` would
 * disagree with what the write route registers for the identical `fields` — the divergence the
 * two-route comparison exists to catch.
 *
 * Returns the created `Guild` record itself on a success status, never `dmHttpRequestAdapter`'s
 * `{ status, body }` envelope — the runner parses whatever this route returns straight through
 * `guildContract`, and that contract can never accept an envelope. `dmHttpResponseUnwrapAdapter` is
 * what makes a failure status hold too, by throwing instead of handing the envelope onward.
 *
 * USAGE:
 * await guildApiRouteBroker({ target, fields: { name, path } });
 * // Returns the created Guild on a success status; throws naming the url, status and body otherwise
 */
import { dmHttpRequestAdapter } from '../../../adapters/dm-http/request/dm-http-request-adapter';
import { dmHttpResponseUnwrapAdapter } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter';
import { guildFieldsContract } from '../../../contracts/guild-fields/guild-fields-contract';
import { guildPathDeriveTransformer } from '../../../transformers/guild-path-derive/guild-path-derive-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const GUILDS_PATH = '/api/guilds';

export const guildApiRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<unknown> => {
  const parsedFields = guildFieldsContract.parse(fields);
  const path = guildPathDeriveTransformer({ target, path: parsedFields.path });

  const response = await dmHttpRequestAdapter({
    target,
    method: 'POST',
    path: GUILDS_PATH,
    body: { name: parsedFields.name, path },
  });

  return dmHttpResponseUnwrapAdapter({
    response,
    url: target.baseUrl === undefined ? GUILDS_PATH : `${target.baseUrl}${GUILDS_PATH}`,
  });
};
