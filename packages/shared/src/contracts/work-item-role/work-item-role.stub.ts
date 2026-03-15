import { workItemRoleContract } from './work-item-role-contract';
import type { WorkItemRole } from './work-item-role-contract';

export const WorkItemRoleStub = ({ value }: { value?: WorkItemRole } = {}): WorkItemRole =>
  workItemRoleContract.parse(value ?? 'codeweaver');
