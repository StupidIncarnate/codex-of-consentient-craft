import { shotDiffCountBroker } from './shot-diff-count-broker';
import { shotDiffCountBrokerProxy } from './shot-diff-count-broker.proxy';

describe('shotDiffCountBroker', () => {
  describe('measured pixel counts', () => {
    it('VALID: {0 of 100 pixels differ} => returns 0', async () => {
      const proxy = shotDiffCountBrokerProxy();
      const previousPath = '/tmp/runs/run_1/step1_frame1.png';
      const currentPath = '/tmp/runs/run_1/step1_frame2.png';

      proxy.stagesShot({
        path: previousPath,
        width: 10,
        height: 10,
        pixels: new Uint8Array(400).fill(255),
      });
      proxy.stagesShot({
        path: currentPath,
        width: 10,
        height: 10,
        pixels: new Uint8Array(400).fill(255),
      });

      const result = await shotDiffCountBroker({ previousPath, currentPath });

      expect(result).toBe(0);
    });

    it('VALID: {1 of 10000 pixels differs, 0.01% — rounds to a whole 0%} => returns 1, never 0', async () => {
      const proxy = shotDiffCountBrokerProxy();
      const previousPath = '/tmp/runs/run_1/step1_frame1.png';
      const currentPath = '/tmp/runs/run_1/step1_frame2.png';
      const changedPixels = new Uint8Array(40000).fill(255);
      changedPixels[0] = 0;
      changedPixels[1] = 0;
      changedPixels[2] = 0;

      proxy.stagesShot({
        path: previousPath,
        width: 100,
        height: 100,
        pixels: new Uint8Array(40000).fill(255),
      });
      proxy.stagesShot({ path: currentPath, width: 100, height: 100, pixels: changedPixels });

      const result = await shotDiffCountBroker({ previousPath, currentPath });

      expect(result).toBe(1);
    });
  });

  describe('dimension mismatch', () => {
    it('VALID: {a 10x10 frame then a 5x5 frame} => returns 100, the larger frame whole', async () => {
      const proxy = shotDiffCountBrokerProxy();
      const previousPath = '/tmp/runs/run_1/step1_frame1.png';
      const currentPath = '/tmp/runs/run_1/step1_frame2.png';

      proxy.stagesShot({
        path: previousPath,
        width: 10,
        height: 10,
        pixels: new Uint8Array(400).fill(255),
      });
      proxy.stagesShot({
        path: currentPath,
        width: 5,
        height: 5,
        pixels: new Uint8Array(100).fill(255),
      });

      const result = await shotDiffCountBroker({ previousPath, currentPath });

      expect(result).toBe(100);
    });
  });
});
