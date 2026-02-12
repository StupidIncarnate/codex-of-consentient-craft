import { orchestrationEventsState } from './orchestration-events-state';

export const orchestrationEventsStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    orchestrationEventsState.removeAllListeners();
  },
});
