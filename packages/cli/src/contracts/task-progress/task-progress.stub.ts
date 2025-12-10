import { taskProgressContract } from './task-progress-contract';
import type { TaskProgress } from './task-progress-contract';

export const TaskProgressStub = ({ value }: { value?: string } = {}): TaskProgress =>
  taskProgressContract.parse(value ?? '0/0');
