import type { StubArgument } from '@dungeonmaster/shared/@types';
import { moduleDependencyContract, type ModuleDependency } from './module-dependency-contract';

export const ModuleDependencyStub = ({
  ...props
}: StubArgument<ModuleDependency> = {}): ModuleDependency =>
  moduleDependencyContract.parse({
    specifier: './foo',
    kind: 'named',
    importedNames: ['foo'],
    ...props,
  });
