import { moduleSpecifierContract } from './module-specifier-contract';
import type { ModuleSpecifier } from './module-specifier-contract';

export const ModuleSpecifierStub = ({ value }: { value?: string } = {}): ModuleSpecifier =>
  moduleSpecifierContract.parse(value ?? '@dungeonmaster/node/fs');
