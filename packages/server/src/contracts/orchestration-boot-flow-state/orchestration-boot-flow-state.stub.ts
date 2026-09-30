/**
 * PURPOSE: Builds a valid OrchestrationBootFlowState for tests
 *
 * USAGE:
 * OrchestrationBootFlowStateStub();
 * // Returns a valid OrchestrationBootFlowState
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationBootFlowStateContract } from './orchestration-boot-flow-state-contract';
import type { OrchestrationBootFlowState } from './orchestration-boot-flow-state-contract';

export const OrchestrationBootFlowStateStub = ({
  ...props
}: StubArgument<OrchestrationBootFlowState> = {}): OrchestrationBootFlowState =>
  orchestrationBootFlowStateContract.parse({ ran: false, ...props });
