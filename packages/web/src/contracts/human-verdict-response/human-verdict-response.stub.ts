import type { StubArgument } from '@dungeonmaster/shared/@types';

import { humanVerdictResponseContract } from './human-verdict-response-contract';
import type { HumanVerdictResponse } from './human-verdict-response-contract';

export const HumanVerdictResponseStub = ({
  ...props
}: StubArgument<HumanVerdictResponse> = {}): HumanVerdictResponse =>
  humanVerdictResponseContract.parse({
    ok: true,
    ...props,
  });
