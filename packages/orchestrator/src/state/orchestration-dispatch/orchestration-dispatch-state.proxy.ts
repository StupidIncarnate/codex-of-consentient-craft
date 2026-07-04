import { orchestrationDispatchState } from './orchestration-dispatch-state';

export const orchestrationDispatchStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    orchestrationDispatchState.clear();
  },
});
