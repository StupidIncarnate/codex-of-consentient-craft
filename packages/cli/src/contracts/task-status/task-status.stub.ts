import { taskStatusContract } from './task-status-contract';
import type { TaskStatus } from './task-status-contract';

export const TaskStatusStub = ({ value }: { value?: TaskStatus } = {}): TaskStatus =>
  taskStatusContract.parse(value ?? 'pending');
