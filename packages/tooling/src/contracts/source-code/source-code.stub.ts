import { sourceCodeContract } from './source-code-contract';
import type { SourceCode } from './source-code-contract';

export const SourceCodeStub = (
  { value }: { value: string } = { value: 'const x = "test";' },
): SourceCode => sourceCodeContract.parse(value);
