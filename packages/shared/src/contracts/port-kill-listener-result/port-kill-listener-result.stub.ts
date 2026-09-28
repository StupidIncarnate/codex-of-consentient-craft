/**
 * PURPOSE: Stub factory for PortKillListenerResult instances
 *
 * USAGE:
 * const result = PortKillListenerResultStub({ pid: 12345 });
 * // Returns a valid PortKillListenerResult with exitCode 0 and empty output
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import {
  portKillListenerResultContract,
  type PortKillListenerResult,
} from './port-kill-listener-result-contract';

export const PortKillListenerResultStub = ({
  ...props
}: StubArgument<PortKillListenerResult> = {}): PortKillListenerResult =>
  portKillListenerResultContract.parse({
    pid: 12345,
    exitCode: 0,
    output: '',
    ...props,
  });
