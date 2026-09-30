/**
 * PURPOSE: Names the one key of `.dungeonmaster.json` the gateway lint-config reader touches, so the raw
 * file text goes straight into a parse and the reader never narrows an `unknown` by hand. Reach for
 * gatewayLintConfigContract when you already hold the `gateway` value itself.
 *
 * USAGE:
 * gatewayLintConfigFileContract.safeParse(JSON.parse(text));
 * // Success carries the file with `gateway` validated; every other key passes through untouched
 */

import { z } from '#gateway/npm/zod';

import { gatewayLintConfigContract } from '../gateway-lint-config/gateway-lint-config-contract';

export const gatewayLintConfigFileContract = z
  .object({
    gateway: gatewayLintConfigContract.optional(),
  })
  .loose()
  .brand<'GatewayLintConfigFile'>();

export type GatewayLintConfigFile = z.infer<typeof gatewayLintConfigFileContract>;
