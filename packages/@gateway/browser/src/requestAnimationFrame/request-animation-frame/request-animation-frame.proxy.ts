import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

const isCallback = (value: unknown): boolean => typeof value === 'function';

export const requestAnimationFrameProxy = (): {
  stageFrameId: (params: { frameId: number }) => void;
  getCalls: () => RecordedCalls;
} => {
  // passthrough: frames requested by other code (Mantine, React) keep running for real.
  const handle = registerSpyOn({
    object: globalThis,
    method: 'requestAnimationFrame',
    passthrough: true,
  });

  return {
    stageFrameId: ({ frameId }: { frameId: number }): void => {
      handle.calledWith([isCallback]).returns(frameId);
    },

    getCalls: (): RecordedCalls => handle.callsMatching([isCallback]),
  };
};
