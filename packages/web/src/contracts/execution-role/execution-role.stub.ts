import { executionRoleContract } from './execution-role-contract';
import type { ExecutionRole } from './execution-role-contract';

export const ExecutionRoleStub = ({ value }: { value?: string } = {}): ExecutionRole =>
  executionRoleContract.parse(value ?? 'codeweaver');
