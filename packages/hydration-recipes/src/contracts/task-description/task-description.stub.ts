/**
 * PURPOSE: Builds a valid `TaskDescription` for a test that needs one but does not care which
 * label it carries.
 *
 * USAGE:
 * TaskDescriptionStub({ value: 'Seeded task 1' });
 * // Returns TaskDescription
 */
import { taskDescriptionContract } from './task-description-contract';
import type { TaskDescription } from './task-description-contract';

export const TaskDescriptionStub = (
  { value }: { value: string } = { value: 'Seeded task 1' },
): TaskDescription => taskDescriptionContract.parse(value);
