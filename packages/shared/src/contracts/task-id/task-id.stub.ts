import { taskIdContract } from './task-id-contract';
import type { TaskId } from './task-id-contract';

export const TaskIdStub = (
  { value }: { value: string } = { value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' },
): TaskId => taskIdContract.parse(value);
