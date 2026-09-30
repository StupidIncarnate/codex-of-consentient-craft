import { ScrollReadingStub } from '../../../contracts/scroll-reading/scroll-reading.stub';
import { stepScreenshotBroker } from './step-screenshot-broker';
import { stepScreenshotBrokerProxy } from './step-screenshot-broker.proxy';

describe('stepScreenshotBroker', () => {
  describe('capture', () => {
    it('VALID: {filePath} => drives session.capture with the path and returns it as the reading', async () => {
      const proxy = stepScreenshotBrokerProxy();
      const { session, getCaptureCalls } = proxy.session();
      const filePath =
        '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2/step4.png';

      const result = await stepScreenshotBroker({ session, filePath });

      expect(getCaptureCalls()).toStrictEqual([[{ filePath }]]);
      expect(result).toBe(filePath);
    });
  });

  describe('cut-off signal', () => {
    it('VALID: {page taller than the viewport} => the reading is the path plus the cut-off line', async () => {
      const proxy = stepScreenshotBrokerProxy();
      const { session } = proxy.sessionWithScroll({
        reading: ScrollReadingStub({
          scrollWidth: 600,
          viewportWidth: 600,
          scrollHeight: 900,
          viewportHeight: 500,
        }),
      });

      const result = await stepScreenshotBroker({ session, filePath: '/repo/shots/step4.png' });

      expect(result).toBe(
        '/repo/shots/step4.png\nCUT OFF — page 900px tall; 400px below the viewport',
      );
    });

    it('VALID: {page wider than the viewport} => the cut-off line names the width', async () => {
      const proxy = stepScreenshotBrokerProxy();
      const { session } = proxy.sessionWithScroll({
        reading: ScrollReadingStub({ scrollWidth: 1200, viewportWidth: 1000 }),
      });

      const result = await stepScreenshotBroker({ session, filePath: '/repo/shots/step4.png' });

      expect(result).toBe(
        '/repo/shots/step4.png\nCUT OFF — page 1200px wide; 200px right of the viewport',
      );
    });

    it('VALID: {page fits the viewport} => the reading is the bare path', async () => {
      const proxy = stepScreenshotBrokerProxy();
      const { session } = proxy.sessionWithScroll({ reading: ScrollReadingStub() });

      const result = await stepScreenshotBroker({ session, filePath: '/repo/shots/step4.png' });

      expect(result).toBe('/repo/shots/step4.png');
    });
  });
});
