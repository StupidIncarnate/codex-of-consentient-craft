import type { StubArgument } from '@questmaestro/shared/@types';
import { fileStatsContract } from './file-stats-contract';
import type { FileStats } from './file-stats-contract';

export const FileStatsStub = ({ ...props }: StubArgument<FileStats> = {}): FileStats => {
  const { isFile, isDirectory, ...dataProps } = props;

  return {
    ...fileStatsContract.parse({
      size: 1024,
      ...dataProps,
    }),
    isFile: isFile ?? ((): boolean => true),
    isDirectory: isDirectory ?? ((): boolean => false),
  };
};
