import { testGuildNameContract } from './test-guild-name-contract';
import type { TestGuildName } from './test-guild-name-contract';

export const TestGuildNameStub = (
  { value }: { value: string } = { value: 'test-guild' },
): TestGuildName => testGuildNameContract.parse(value);
