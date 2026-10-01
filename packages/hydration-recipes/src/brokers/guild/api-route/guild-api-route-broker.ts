/**
 * PURPOSE: The guild ingredient's `api` route — `POST /api/guilds` through the real server
 * handler. Reach for `guildPathDeriveTransformer` here too, exactly as the `write` route does:
 * without it, a caller who never sets an explicit `path` would send the RELATIVE fragment
 * `defaults(index)` minted straight over the wire, and the api-created guild's `path` would
 * disagree with what the write route registers for the identical `fields` — the divergence the
 * two-route comparison exists to catch.
 *
 * THE MKDIR IS FENCED TO THE TARGET, through `guildDirectoryEnsureBroker` — the identical check
 * `guildWriteRouteBroker` runs, and for the identical reason: `routeSelectTransformer` picks `api`
 * over `write` whenever a target carries a `baseUrl` (every live siegelense lane does), so a
 * seeded guild NEVER reaches the write route at all on a live target. The real `POST /api/guilds`
 * handler legitimately does not `mkdir` an arbitrary path — a real guild's path points at a
 * project the operator already has — so without this, a seeded guild registers against a
 * directory nothing ever created and reads back `valid: false` from `guildQueryRouteBroker`'s own
 * `fs.access` check. An already-absolute path outside the target is registered as given and left
 * uncreated, matching the write route's own rule for a path the target merely points at rather
 * than owns.
 *
 * Returns the created `Guild` record itself on a success status, never `dmHttpRequestBroker`'s
 * `{ status, body }` envelope — the runner parses whatever this route returns straight through
 * `guildContract`, and that contract can never accept an envelope. `dmHttpResponseUnwrapTransformer` is
 * what makes a failure status hold too, by throwing instead of handing the envelope onward. A
 * transport failure — `dmHttpRequestBroker`'s own `fetch` or `request` rejecting before any status
 * exists — carries the url attached by `dmHttpRequestBroker` itself, so `routeFailureTransformer`
 * can still mine a `url` off it.
 *
 * `guildUniquePathResolveBroker` runs BEFORE the path is derived absolute — DEF-78 — so composing
 * two guild recipes into one target (or seeding `guild-empty` twice, and a live siegelense lane
 * ALWAYS runs this route rather than `write`) never posts the identical literal
 * `guilds-under-test/guild-1` twice: the real server would answer a repeat with a 500 naming the
 * duplicate path, and the second seed's default fragment bumps to `guild-2` before that request is
 * ever sent.
 *
 * USAGE:
 * await guildApiRouteBroker({ target, fields: { name, path } });
 * // Returns the created Guild on a success status; throws naming the url, status and body otherwise
 */
import { guildDirectoryEnsureBroker } from '../directory-ensure/guild-directory-ensure-broker';
import { guildUniquePathResolveBroker } from '../unique-path-resolve/guild-unique-path-resolve-broker';
import { dmHttpRequestBroker } from '../../dm/http-request/dm-http-request-broker';
import { guildFieldsContract } from '../../../contracts/guild-fields/guild-fields-contract';
import { dmHttpResponseUnwrapTransformer } from '../../../transformers/dm-http-response-unwrap/dm-http-response-unwrap-transformer';
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
  const uniquePath = guildUniquePathResolveBroker({ target, path: parsedFields.path });
  const path = guildPathDeriveTransformer({ target, path: uniquePath });

  await guildDirectoryEnsureBroker({ target, path });

  const url = target.baseUrl === undefined ? GUILDS_PATH : `${target.baseUrl}${GUILDS_PATH}`;

  const response = await dmHttpRequestBroker({
    target,
    method: 'POST',
    path: GUILDS_PATH,
    body: { name: parsedFields.name, path },
  });

  return dmHttpResponseUnwrapTransformer({ response, url });
};
