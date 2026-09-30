import type { StubArgument } from '@dungeonmaster/shared/@types';
import { folderConfigContract } from './folder-config-contract';
import type { AllowedExternalImports } from './folder-config-contract';

export const AllowedExternalImportsStub = ({
  ...props
}: StubArgument<AllowedExternalImports> = {}): AllowedExternalImports =>
  folderConfigContract.parse({
    widgets: ['react'],
    bindings: ['react'],
    state: [],
    flows: ['react-router-dom'],
    responders: ['express'],
    contracts: ['zod'],
    brokers: [],
    transformers: [],
    errors: [],
    middleware: [],
    startup: ['*'],
    ...props,
  });
