import { smoketestSuiteContract } from './smoketest-suite-contract';
import type { SmoketestSuite } from './smoketest-suite-contract';

export const SmoketestSuiteStub = ({ value }: { value?: SmoketestSuite } = {}): SmoketestSuite =>
  smoketestSuiteContract.parse(value ?? 'mcp');
