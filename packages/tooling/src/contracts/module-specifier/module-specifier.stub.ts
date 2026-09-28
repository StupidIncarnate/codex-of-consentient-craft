import { moduleSpecifierContract } from './module-specifier-contract';
import type { ModuleSpecifier } from './module-specifier-contract';

export const ModuleSpecifierStub = (
  { value }: { value: string } = { value: 'fs/promises' },
): ModuleSpecifier => moduleSpecifierContract.parse(value);
