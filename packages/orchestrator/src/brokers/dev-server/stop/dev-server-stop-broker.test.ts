import { devServerStopBroker } from './dev-server-stop-broker';
import { devServerStopBrokerProxy } from './dev-server-stop-broker.proxy';

describe('devServerStopBroker', () => {
  describe('process exits on SIGTERM', () => {
    it('VALID: {process closes after SIGTERM} => resolves without sending SIGKILL', async () => {
      const proxy = devServerStopBrokerProxy();
      const proc = proxy.makeProcessThatExitsOnSigterm();

      await devServerStopBroker({ process: proc });

      expect(proc.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('process does not exit on SIGTERM', () => {
    it('VALID: {process ignores SIGTERM, times out} => sends SIGKILL after timeout', async () => {
      jest.useFakeTimers();

      const proxy = devServerStopBrokerProxy();
      const proc = proxy.makeProcessThatIgnoresSigterm();

      const stopPromise = devServerStopBroker({ process: proc });

      jest.advanceTimersByTime(5000);
      await stopPromise;

      jest.useRealTimers();

      expect(proxy.getKillCalls(proc)).toStrictEqual([['SIGTERM'], ['SIGKILL']]);
    });
  });

  describe('kill throws', () => {
    it('ERROR: {kill throws on SIGTERM} => resolves without throwing', async () => {
      const proxy = devServerStopBrokerProxy();
      const proc = proxy.makeProcessWhereKillThrows();

      await expect(devServerStopBroker({ process: proc })).resolves.toStrictEqual({
        success: true,
      });
    });
  });
});
