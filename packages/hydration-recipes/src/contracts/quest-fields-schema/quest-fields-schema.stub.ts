/**
 * PURPOSE: Builds a valid `QuestFields` through `questFieldsSchemaContract` rather than
 * `questFieldsContract` directly — same defaults `QuestFieldsStub` uses, so a test proving the two
 * contracts parse identically never hand-writes two divergent literals.
 *
 * USAGE:
 * QuestFieldsSchemaStub({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns QuestFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questFieldsSchemaContract } from './quest-fields-schema-contract';
import type { QuestFields } from '../quest-fields/quest-fields-contract';

export const QuestFieldsSchemaStub = ({ ...props }: StubArgument<QuestFields> = {}): QuestFields =>
  questFieldsSchemaContract.parse({
    title: 'Quest 1',
    status: 'created',
    userRequest: 'seeded quest 1',
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
