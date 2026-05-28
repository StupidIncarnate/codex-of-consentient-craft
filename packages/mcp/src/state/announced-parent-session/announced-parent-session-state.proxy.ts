import type { SessionId } from '@dungeonmaster/shared/contracts';

import { announcedParentSessionState } from './announced-parent-session-state';

export const announcedParentSessionStateProxy = (): {
  setupCleared: () => void;
  setupAnnounced: (params: { parentSessionId: SessionId }) => void;
} => ({
  setupCleared: (): void => {
    announcedParentSessionState.clear();
  },
  setupAnnounced: ({ parentSessionId }: { parentSessionId: SessionId }): void => {
    announcedParentSessionState.clear();
    announcedParentSessionState.set({ parentSessionId });
  },
});
