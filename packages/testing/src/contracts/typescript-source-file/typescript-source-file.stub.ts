import { typescriptSourceFileContract } from './typescript-source-file-contract';
import type { TypescriptSourceFile } from './typescript-source-file-contract';

export const TypescriptSourceFileStub = ({ value }: { value: unknown }): TypescriptSourceFile =>
  typescriptSourceFileContract.parse(value);
