import { testIdContract } from './test-id-contract';
import type { TestId } from './test-id-contract';

export const TestIdStub = ({ value }: { value?: string } = {}): TestId =>
  testIdContract.parse(value ?? 'test-id');
