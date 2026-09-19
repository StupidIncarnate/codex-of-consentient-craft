/**
 * PURPOSE: Builds a valid `GuildFields` for a test that needs one but does not care which name or
 * path it carries.
 *
 * USAGE:
 * GuildFieldsStub({ name: 'Guild 1', path: '/tmp/guilds-under-test/guild-1' });
 * // Returns GuildFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { guildFieldsContract } from './guild-fields-contract';
import type { GuildFields } from './guild-fields-contract';

export const GuildFieldsStub = ({ ...props }: StubArgument<GuildFields> = {}): GuildFields =>
  guildFieldsContract.parse({
    name: 'Guild 1',
    path: '/tmp/guild-fields-stub/guild-1',
    ...props,
  });
