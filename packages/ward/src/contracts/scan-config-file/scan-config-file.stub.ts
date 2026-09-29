import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scanConfigFileContract } from './scan-config-file-contract';
import type { ScanConfigFile } from './scan-config-file-contract';

export const ScanConfigFileStub = ({
  ...props
}: StubArgument<ScanConfigFile> = {}): ScanConfigFile =>
  scanConfigFileContract.parse({
    directory: '/tmp/ward-scan-abc123',
    path: '/tmp/ward-scan-abc123/eslint.scan.config.cjs',
    ...props,
  });
