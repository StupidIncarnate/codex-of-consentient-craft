import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { monitorSessionState } from './monitor-session-state';

export const monitorSessionStateProxy = (): {
  setupEmpty: () => void;
  setupRegistered: (params: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }) => void;
} => ({
  setupEmpty: (): void => {
    monitorSessionState.clear();
  },
  setupRegistered: ({
    projectDir,
    sessionFilePath,
    registeredAt,
  }: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }): void => {
    monitorSessionState.clear();
    monitorSessionState.register({ projectDir, sessionFilePath, registeredAt });
  },
});
