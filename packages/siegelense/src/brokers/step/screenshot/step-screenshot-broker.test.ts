import { stepScreenshotBroker } from './step-screenshot-broker';
import { stepScreenshotBrokerProxy } from './step-screenshot-broker.proxy';

describe('stepScreenshotBroker', () => {
  describe('capture', () => {
    it('VALID: {filePath} => drives session.capture with the path and returns it as the reading', async () => {
      const proxy = stepScreenshotBrokerProxy();
      const { session, getCaptureCalls } = proxy.session();
      const filePath = '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step4.png';

      const result = await stepScreenshotBroker({ session, filePath });

      expect(getCaptureCalls()).toStrictEqual([[{ filePath }]]);
      expect(result).toBe(filePath);
    });
  });
});
