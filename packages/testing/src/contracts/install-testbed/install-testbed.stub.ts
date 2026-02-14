import type { StubArgument } from '@dungeonmaster/shared/@types';
import { installTestbedContract } from './install-testbed-contract';
import { exitCodeContract } from '../exit-code/exit-code-contract';
import { processOutputContract } from '../process-output/process-output-contract';
import type { InstallTestbed } from './install-testbed-contract';

export const InstallTestbedStub = ({
  ...props
}: StubArgument<InstallTestbed> = {}): InstallTestbed => {
  const {
    cleanup,
    writeFile,
    readFile,
    getClaudeSettings,
    getMcpConfig,
    getDungeonmasterConfig,
    getEslintConfig,
    runInitCommand,
    ...dataProps
  } = props;

  return {
    ...installTestbedContract.parse({
      guildPath: `/tmp/install-testbed-${Date.now()}`,
      dungeonmasterPath: '/repo/dungeonmaster',
      ...dataProps,
    }),
    cleanup: cleanup ?? ((): void => undefined),
    writeFile: writeFile ?? ((): void => undefined),
    readFile: readFile ?? ((): null => null),
    getClaudeSettings: getClaudeSettings ?? ((): null => null),
    getMcpConfig: getMcpConfig ?? ((): null => null),
    getDungeonmasterConfig: getDungeonmasterConfig ?? ((): null => null),
    getEslintConfig: getEslintConfig ?? ((): null => null),
    runInitCommand:
      runInitCommand ??
      ((): ReturnType<InstallTestbed['runInitCommand']> => ({
        exitCode: exitCodeContract.parse(0),
        stdout: processOutputContract.parse(''),
        stderr: processOutputContract.parse(''),
      })),
  };
};
