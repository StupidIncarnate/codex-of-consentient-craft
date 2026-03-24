import { testStatusContract, type TestStatus } from './test-status-contract';

export const TestStatusStub = ({ value }: { value?: string } = {}): TestStatus =>
  testStatusContract.parse(value ?? 'passed');
