import { portRoleContract } from './port-role-contract';
import type { PortRole } from './port-role-contract';

export const PortRoleStub = ({ value }: { value: string } = { value: 'api' }): PortRole =>
  portRoleContract.parse(value);
