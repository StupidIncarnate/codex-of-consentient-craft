import { taskTypeContract } from './task-type-contract';
import type { TaskType } from './task-type-contract';

export const TaskTypeStub = ({ value }: { value?: TaskType } = {}): TaskType =>
  taskTypeContract.parse(value ?? 'implementation');
