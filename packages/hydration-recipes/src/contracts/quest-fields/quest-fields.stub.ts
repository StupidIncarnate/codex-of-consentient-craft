/**
 * PURPOSE: Builds a valid `QuestFields` for a test that needs one but does not care about most of
 * a quest's shape — every array/object field `questContract` defaults keeps that default, so the
 * override is only ever the handful of fields a caller actually varies.
 *
 * USAGE:
 * QuestFieldsStub({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns QuestFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questFieldsContract } from './quest-fields-contract';
import type { QuestFields } from './quest-fields-contract';

export const QuestFieldsStub = ({ ...props }: StubArgument<QuestFields> = {}): QuestFields =>
  questFieldsContract.parse({
    title: 'Quest 1',
    status: 'created',
    userRequest: 'seeded quest 1',
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
