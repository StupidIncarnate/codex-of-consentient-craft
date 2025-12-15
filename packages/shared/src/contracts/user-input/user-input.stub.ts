/**
 * PURPOSE: Stub factory for UserInput branded string type
 *
 * USAGE:
 * const input = UserInputStub({ value: 'user text' });
 * // Returns branded UserInput string
 */
import { userInputContract, type UserInput } from './user-input-contract';

export const UserInputStub = (
  { value }: { value: string } = { value: 'stub user input' },
): UserInput => userInputContract.parse(value);
