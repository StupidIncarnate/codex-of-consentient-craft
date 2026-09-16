/**
 * PURPOSE: Builds a valid `SessionWithNestedChainInputs` for a test that needs one but does not
 * care which guild path it names.
 *
 * USAGE:
 * SessionWithNestedChainInputsStub({ guildPath: '/tmp/guild-1' });
 * // Returns SessionWithNestedChainInputs
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sessionWithNestedChainInputsContract } from './session-with-nested-chain-inputs-contract';
import type { SessionWithNestedChainInputs } from './session-with-nested-chain-inputs-contract';

export const SessionWithNestedChainInputsStub = ({
  ...props
}: StubArgument<SessionWithNestedChainInputs> = {}): SessionWithNestedChainInputs =>
  sessionWithNestedChainInputsContract.parse({
    guildPath: '/tmp/session-with-nested-chain-inputs-stub/guild-1',
    ...props,
  });
