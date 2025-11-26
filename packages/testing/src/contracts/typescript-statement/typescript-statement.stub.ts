import { typescriptStatementContract } from './typescript-statement-contract';
import type { TypescriptStatement } from './typescript-statement-contract';

export const TypescriptStatementStub = ({ value }: { value: unknown }): TypescriptStatement =>
  typescriptStatementContract.parse(value);
