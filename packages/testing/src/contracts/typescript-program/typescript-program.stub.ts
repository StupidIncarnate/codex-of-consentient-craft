import { typescriptProgramContract } from './typescript-program-contract';
import type { TypescriptProgram } from './typescript-program-contract';

export const TypescriptProgramStub = ({ value }: { value: unknown }): TypescriptProgram =>
  typescriptProgramContract.parse(value);
