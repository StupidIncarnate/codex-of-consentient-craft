import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questClarifyErrorContract } from './quest-clarify-error-contract';
import type { QuestClarifyError } from './quest-clarify-error-contract';

export const QuestClarifyErrorStub = ({
  ...props
}: StubArgument<QuestClarifyError> = {}): QuestClarifyError =>
  questClarifyErrorContract.parse({
    error: 'Clarify refused',
    ...props,
  });
