import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  typescriptModuleShapeContract,
  type TypescriptModuleShape,
} from './typescript-module-shape-contract';

export const TypescriptModuleShapeStub = ({
  ...props
}: StubArgument<TypescriptModuleShape> = {}): TypescriptModuleShape =>
  typescriptModuleShapeContract.parse({
    dependencies: [],
    localExportNames: ['foo'],
    ...props,
  });
