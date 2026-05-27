import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { monitorSessionStateProxy } from '../../../state/monitor-session/monitor-session-state.proxy';

export const QuestMonitorSessionGetResponderProxy = (): {
  setupRegistered: (params: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }) => void;
  setupNoSession: () => void;
} => {
  const stateProxy = monitorSessionStateProxy();

  return {
    setupRegistered: ({
      projectDir,
      sessionFilePath,
      registeredAt,
    }: {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    }): void => {
      stateProxy.setupRegistered({ projectDir, sessionFilePath, registeredAt });
    },

    setupNoSession: (): void => {
      stateProxy.setupEmpty();
    },
  };
};
