import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { shotChangeReadBroker } from './shot-change-read-broker';
import { shotChangeReadBrokerProxy } from './shot-change-read-broker.proxy';

describe('shotChangeReadBroker', () => {
  describe('no predecessor', () => {
    it('EDGE: {previousPath: null} => returns null, never 0 — spec line 708: reporting 0 would manufacture a no-change finding on the opening step of every walk', async () => {
      shotChangeReadBrokerProxy();
      const currentPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const result = await shotChangeReadBroker({ previousPath: null, currentPath });

      expect(result).toBe(null);
    });
  });

  describe('measured pixel differences on a 10x10 (100-pixel) frame', () => {
    it("VALID: {2 of 100 pixels differ} => returns '2%'", async () => {
      const proxy = shotChangeReadBrokerProxy();
      const previousPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const currentPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step2.png',
      });
      const previousPixels = new Uint8Array(400).fill(255);
      const currentPixels = new Uint8Array(400).fill(255);
      const flatPixelStride = 4;
      const firstDifferingPixel = 0;
      const secondDifferingPixel = 50;
      currentPixels[firstDifferingPixel * flatPixelStride] = 0;
      currentPixels[firstDifferingPixel * flatPixelStride + 1] = 0;
      currentPixels[firstDifferingPixel * flatPixelStride + 2] = 0;
      currentPixels[secondDifferingPixel * flatPixelStride] = 0;
      currentPixels[secondDifferingPixel * flatPixelStride + 1] = 0;
      currentPixels[secondDifferingPixel * flatPixelStride + 2] = 0;

      proxy.stagesShot({ path: previousPath, width: 10, height: 10, pixels: previousPixels });
      proxy.stagesShot({ path: currentPath, width: 10, height: 10, pixels: currentPixels });

      const result = await shotChangeReadBroker({ previousPath, currentPath });

      expect(result).toBe('2%');
    });

    it("VALID: {0 of 100 differ} => returns '0%', a real reading that must not collapse to null", async () => {
      const proxy = shotChangeReadBrokerProxy();
      const previousPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step3.png',
      });
      const currentPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step4.png',
      });
      const identicalPixels = new Uint8Array(400).fill(255);

      proxy.stagesShot({
        path: previousPath,
        width: 10,
        height: 10,
        pixels: new Uint8Array(identicalPixels),
      });
      proxy.stagesShot({
        path: currentPath,
        width: 10,
        height: 10,
        pixels: new Uint8Array(identicalPixels),
      });

      const result = await shotChangeReadBroker({ previousPath, currentPath });

      expect(result).toBe('0%');
    });

    it("VALID: {100 of 100 differ} => returns '100%'", async () => {
      const proxy = shotChangeReadBrokerProxy();
      const previousPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step5.png',
      });
      const currentPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step6.png',
      });
      const whitePixels = new Uint8Array(400).fill(255);
      const blackPixels = new Uint8Array(400).fill(0);
      // Alpha stays opaque — only the colour channels flip to black.
      for (let byteIndex = 3; byteIndex < blackPixels.length; byteIndex += 4) {
        blackPixels[byteIndex] = 255;
      }

      proxy.stagesShot({ path: previousPath, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: currentPath, width: 10, height: 10, pixels: blackPixels });

      const result = await shotChangeReadBroker({ previousPath, currentPath });

      expect(result).toBe('100%');
    });
  });

  describe('dimension mismatch', () => {
    it("VALID: {frames of different sizes} => returns '100%'", async () => {
      const proxy = shotChangeReadBrokerProxy();
      const previousPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step7.png',
      });
      const currentPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step8.png',
      });

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

      const result = await shotChangeReadBroker({ previousPath, currentPath });

      expect(result).toBe('100%');
    });
  });
});
