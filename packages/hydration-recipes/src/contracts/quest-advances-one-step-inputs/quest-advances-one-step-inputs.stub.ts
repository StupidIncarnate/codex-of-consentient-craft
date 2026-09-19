/**
 * PURPOSE: Builds a valid `QuestAdvancesOneStepInputs` for a test that needs one but does not
 * care which guild id it names.
 *
 * USAGE:
 * QuestAdvancesOneStepInputsStub({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns QuestAdvancesOneStepInputs
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questAdvancesOneStepInputsContract } from './quest-advances-one-step-inputs-contract';
import type { QuestAdvancesOneStepInputs } from './quest-advances-one-step-inputs-contract';

export const QuestAdvancesOneStepInputsStub = ({
  ...props
}: StubArgument<QuestAdvancesOneStepInputs> = {}): QuestAdvancesOneStepInputs =>
  questAdvancesOneStepInputsContract.parse({
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
