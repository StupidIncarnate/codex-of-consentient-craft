export const timerClearTimeoutAdapterProxy = (): {
  getClearedTimerId: () => unknown;
} => {
  const clearedRef = { timerId: null as unknown };

  jest.spyOn(global, 'clearTimeout').mockImplementation((timerId) => {
    clearedRef.timerId = timerId;
  });

  return {
    getClearedTimerId: (): unknown => clearedRef.timerId,
  };
};
