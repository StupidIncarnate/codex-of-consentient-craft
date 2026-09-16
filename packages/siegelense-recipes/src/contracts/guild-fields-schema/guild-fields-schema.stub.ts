/**
 * PURPOSE: Builds a valid `GuildFields` through `guildFieldsSchemaContract` rather than
 * `guildFieldsContract` directly — same defaults `GuildFieldsStub` uses, so a test proving the two
 * contracts parse identically never hand-writes two divergent literals.
 *
 * USAGE:
 * GuildFieldsSchemaStub({ name: 'Guild 2' });
 * // Returns GuildFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { guildFieldsSchemaContract } from './guild-fields-schema-contract';
import type { GuildFields } from '../guild-fields/guild-fields-contract';

export const GuildFieldsSchemaStub = ({ ...props }: StubArgument<GuildFields> = {}): GuildFields =>
  guildFieldsSchemaContract.parse({
    name: 'Guild 1',
    path: '/tmp/guilds-under-test/guild-1',
    ...props,
  });
