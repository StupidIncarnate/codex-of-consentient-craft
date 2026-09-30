/**
 * PURPOSE: Builds a valid ArchitectureBindingFlowTraceResult for tests
 *
 * USAGE:
 * ArchitectureBindingFlowTraceResultStub();
 * // Returns a valid ArchitectureBindingFlowTraceResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { architectureBindingFlowTraceResultContract } from './architecture-binding-flow-trace-result-contract';
import type { ArchitectureBindingFlowTraceResult } from './architecture-binding-flow-trace-result-contract';

export const ArchitectureBindingFlowTraceResultStub = ({
  ...props
}: StubArgument<ArchitectureBindingFlowTraceResult> = {}): ArchitectureBindingFlowTraceResult =>
  architectureBindingFlowTraceResultContract.parse({ httpFlows: [], wsEvents: [], ...props });
