import { frameworkContract } from './framework-contract';
import type { Framework } from './framework-contract';

export const FrameworkStub = ({ value }: { value?: string } = { value: 'react' }): Framework =>
  frameworkContract.parse(value);
