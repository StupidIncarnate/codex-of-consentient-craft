/**
 * PURPOSE: Builds a valid StepDispatchRole for tests
 *
 * USAGE:
 * StepDispatchRoleStub();
 * // Returns a valid StepDispatchRole
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ClaudeModelStub } from '../claude-model/claude-model.stub';

import { stepDispatchRoleContract } from './step-dispatch-role-contract';
import type { StepDispatchRole } from './step-dispatch-role-contract';

export const StepDispatchRoleStub = ({
  ...props
}: StubArgument<StepDispatchRole> = {}): StepDispatchRole =>
  stepDispatchRoleContract.parse({ prompt: 'sample', model: ClaudeModelStub(), ...props });
