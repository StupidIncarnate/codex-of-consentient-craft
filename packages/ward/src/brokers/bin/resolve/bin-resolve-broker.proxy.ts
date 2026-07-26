import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';

export const binResolveBrokerProxy = (): {
  setupFound: (params: { cwd: AbsoluteFilePath; binName: BinCommand }) => BinCommand;
  setupNotFound: (params: { cwd: AbsoluteFilePath; binName: BinCommand }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    // Returns the resolved command so composing proxies can address the downstream spawn call
    // with the same string binResolveBroker will actually produce.
    setupFound: ({ cwd, binName }: { cwd: AbsoluteFilePath; binName: BinCommand }): BinCommand => {
      const filePath = filePathContract.parse(
        `${String(cwd)}/node_modules/.bin/${String(binName)}`,
      );
      existsProxy.returns({ filePath, result: true });
      return BinCommandStub({ value: String(filePath) });
    },

    setupNotFound: ({ cwd, binName }: { cwd: AbsoluteFilePath; binName: BinCommand }): void => {
      const filePath = filePathContract.parse(
        `${String(cwd)}/node_modules/.bin/${String(binName)}`,
      );
      existsProxy.returns({ filePath, result: false });
    },
  };
};
