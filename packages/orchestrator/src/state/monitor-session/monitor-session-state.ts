/**
 * PURPOSE: Singleton tracking the currently-registered /dumpster-launch monitor session for this server. At most one session can be registered at a time — the second `register-monitor-session` call while one is active is the single-launcher rejection trigger
 *
 * USAGE:
 * monitorSessionState.register({ projectDir, sessionFilePath, registeredAt });
 * monitorSessionState.isRegistered();
 * monitorSessionState.get();
 * monitorSessionState.clear();
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import {
  activeMonitorSessionContract,
  type ActiveMonitorSession,
} from '../../contracts/active-monitor-session/active-monitor-session-contract';
import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';

const state: { active: ActiveMonitorSession | null } = {
  active: null,
};

export const monitorSessionState = {
  register: ({
    projectDir,
    sessionFilePath,
    registeredAt,
  }: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }): void => {
    state.active = activeMonitorSessionContract.parse({
      projectDir,
      sessionFilePath,
      registeredAt,
    });
  },

  isRegistered: (): boolean => state.active !== null,

  get: (): ActiveMonitorSession | null => state.active,

  clear: (): void => {
    state.active = null;
  },
};
