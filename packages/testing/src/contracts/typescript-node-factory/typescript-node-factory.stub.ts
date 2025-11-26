import { typescriptNodeFactoryContract } from './typescript-node-factory-contract';
import type { TypescriptNodeFactory } from './typescript-node-factory-contract';

export const TypescriptNodeFactoryStub = ({ value }: { value: unknown }): TypescriptNodeFactory =>
  typescriptNodeFactoryContract.parse(value);
