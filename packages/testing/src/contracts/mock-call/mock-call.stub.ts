import type { StubArgument } from '@dungeonmaster/shared/@types';
import { mockCallContract } from './mock-call-contract';
import type { MockCall } from './mock-call-contract';
import { ModuleNameStub } from '../module-name/module-name.stub';
import { SourceFileNameStub } from '../source-file-name/source-file-name.stub';

export const MockCallStub = ({ ...props }: StubArgument<MockCall> = {}): MockCall =>
  mockCallContract.parse({
    moduleName: ModuleNameStub({ value: 'fs' }),
    factory: null,
    sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
    ...props,
  });
