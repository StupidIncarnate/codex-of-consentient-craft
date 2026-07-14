import type { StubArgument } from '@dungeonmaster/shared/@types';
import { eslintInstanceContract } from './eslint-instance-contract';
import type { EslintInstance } from './eslint-instance-contract';

export const EslintInstanceStub = ({
  ...props
}: StubArgument<EslintInstance> = {}): EslintInstance => {
  const { calculateConfigForFile, isPathIgnored, ...dataProps } = props;

  const defaultCalculateConfigForFile = async (_filePath: string): Promise<unknown> =>
    Promise.resolve({});

  const defaultIsPathIgnored = async (_filePath: string): Promise<boolean> =>
    Promise.resolve(false);

  return {
    ...eslintInstanceContract.parse({
      ...dataProps,
    }),
    calculateConfigForFile: calculateConfigForFile ?? (defaultCalculateConfigForFile as never),
    isPathIgnored: isPathIgnored ?? (defaultIsPathIgnored as never),
  };
};
