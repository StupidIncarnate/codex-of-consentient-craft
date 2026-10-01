import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  npmModuleExportNamesContract,
  type NpmModuleExportNames,
} from './npm-module-export-names-contract';

export const NpmModuleExportNamesStub = ({
  ...props
}: StubArgument<NpmModuleExportNames> = {}): NpmModuleExportNames =>
  npmModuleExportNamesContract.parse({
    values: ['version'],
    types: ['Options'],
    ...props,
  });
