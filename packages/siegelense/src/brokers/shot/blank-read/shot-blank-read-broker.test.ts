import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { shotBlankReadBroker } from './shot-blank-read-broker';
import { shotBlankReadBrokerProxy } from './shot-blank-read-broker.proxy';

describe('shotBlankReadBroker', () => {
  describe('a fully uniform frame', () => {
    it("VALID: {a 4x4 frame entirely #0d0907} => { blank: true, colour: '#0d0907' } — spec line 723's app-background case", async () => {
      const proxy = shotBlankReadBrokerProxy();
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 16 }, () => backgroundPixel).flat());

      proxy.stagesShot({ shotPath, width: 4, height: 4, pixels });

      const result = await shotBlankReadBroker({ shotPath });

      expect(result).toStrictEqual({ blank: true, colour: '#0d0907' });
    });

    it("VALID: {a 4x4 frame entirely #ffffff} => { blank: true, colour: '#ffffff' } — the unstyled-default half of line 724's table", async () => {
      const proxy = shotBlankReadBrokerProxy();
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step2.png',
      });
      const pixels = new Uint8Array(64).fill(255);

      proxy.stagesShot({ shotPath, width: 4, height: 4, pixels });

      const result = await shotBlankReadBroker({ shotPath });

      expect(result).toStrictEqual({ blank: true, colour: '#ffffff' });
    });
  });

  describe('a differing pixel at a sampled offset', () => {
    it('VALID: {a 4x4 frame with one differing pixel at sample offset 7} => { blank: false, colour: null } — full-blank only (spec line 730)', async () => {
      const proxy = shotBlankReadBrokerProxy();
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step3.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const foregroundPixel = [255, 255, 255, 255];
      const pixelRows = Array.from({ length: 16 }, () => backgroundPixel);
      pixelRows[7] = foregroundPixel;
      const pixels = new Uint8Array(pixelRows.flat());

      proxy.stagesShot({ shotPath, width: 4, height: 4, pixels });

      const result = await shotBlankReadBroker({ shotPath });

      expect(result).toStrictEqual({ blank: false, colour: null });
    });
  });

  describe('channel drift within tolerance', () => {
    it("EDGE: {sampled channels vary by less than channelTolerance} => blank: true — 'one colour, or near enough' (spec line 716)", async () => {
      const proxy = shotBlankReadBrokerProxy();
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step4.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      // +3 on each channel — under perceptionStatics.blank.channelTolerance of 4, the compression
      // jitter this tolerance exists to absorb.
      const jitteredPixel = [0x10, 0x0c, 0x0a, 255];
      const pixelRows = Array.from({ length: 16 }, () => backgroundPixel);
      pixelRows[7] = jitteredPixel;
      pixelRows[14] = jitteredPixel;
      const pixels = new Uint8Array(pixelRows.flat());

      proxy.stagesShot({ shotPath, width: 4, height: 4, pixels });

      const result = await shotBlankReadBroker({ shotPath });

      expect(result).toStrictEqual({ blank: true, colour: '#0d0907' });
    });
  });
});
