import { TimerIdStub } from '../../../contracts/timer-id/timer-id.stub';

type TimerId = ReturnType<typeof TimerIdStub>;

const MOCK_TIMER_ID = 99999;

export const timerSetTimeoutAdapterProxy = (): {
  setupImmediate: () => TimerId;
  setupNeverFire: () => TimerId;
} => {
  jest
    .spyOn(global, 'setTimeout')
    .mockImplementation(() => MOCK_TIMER_ID as unknown as ReturnType<typeof setTimeout>);

  jest.spyOn(global, 'clearTimeout').mockImplementation((): void => undefined);

  return {
    setupImmediate: (): TimerId => {
      jest.mocked(global.setTimeout).mockImplementationOnce((callback: () => void) => {
        setImmediate(() => {
          callback();
        });
        return MOCK_TIMER_ID as unknown as ReturnType<typeof setTimeout>;
      });
      return TimerIdStub({ value: MOCK_TIMER_ID });
    },

    setupNeverFire: (): TimerId => TimerIdStub({ value: MOCK_TIMER_ID }),
  };
};
