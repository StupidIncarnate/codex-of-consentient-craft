export const processDevLogAdapterProxy = (): {
  enableDev: () => void;
  disableDev: () => void;
  getWrittenLines: () => jest.SpyInstance;
} => {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation((): boolean => true);

  return {
    enableDev: (): void => {
      process.env.DUNGEONMASTER_ENV = 'dev';
    },
    disableDev: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_ENV');
    },
    getWrittenLines: (): jest.SpyInstance => spy,
  };
};
