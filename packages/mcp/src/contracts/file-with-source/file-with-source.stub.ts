import { fileWithSourceContract } from './file-with-source-contract';
import type { FileWithSource } from './file-with-source-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const FileWithSourceStub = ({
  ...props
}: StubArgument<FileWithSource> = {}): FileWithSource =>
  fileWithSourceContract.parse({
    filepath: '/test/brokers/user/fetch/user-fetch-broker.ts',
    source: 'project',
    basePath: '/test',
    ...props,
  });
