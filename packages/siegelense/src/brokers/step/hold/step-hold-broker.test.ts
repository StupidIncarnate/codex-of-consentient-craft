import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { stepHoldBroker } from './step-hold-broker';
import { stepHoldBrokerProxy } from './step-hold-broker.proxy';

describe('stepHoldBroker', () => {
  describe('hold settlement detection', () => {
    it('VALID: {differing === 0, shotPath provided} => captures 4 frames live, copies final frame to shotPath, and returns NOTHING CHANGED verdict', async () => {
      const proxy = stepHoldBrokerProxy();
      const lane = LaneSessionStub();
      const captureLiveMock = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: captureLiveMock });
      const shotPath = '/tmp/runs/run_1/step1.png';
      const index = 1;

      const frame1 = '/tmp/runs/run_1/step1_frame1.png';
      const frame2 = '/tmp/runs/run_1/step1_frame2.png';
      const frame3 = '/tmp/runs/run_1/step1_frame3.png';
      const frame4 = '/tmp/runs/run_1/step1_frame4.png';

      const whitePixels = new Uint8Array(400).fill(255);
      proxy.stagesShot({ path: frame1, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame2, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame3, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame4, width: 10, height: 10, pixels: whitePixels });
      proxy.succeedsCopy({ sourcePath: frame4, destinationPath: shotPath });

      const result = await stepHoldBroker({
        lane,
        session,
        index,
        shotPath,
        frames: 4,
        everyMs: 1500,
      });

      expect(captureLiveMock.mock.calls).toStrictEqual([
        [{ filePath: frame1 }],
        [{ filePath: frame2 }],
        [{ filePath: frame3 }],
        [{ filePath: frame4 }],
      ]);
      expect(proxy.getCopiesFrom({ sourcePath: frame4 })).toStrictEqual([[frame4, shotPath]]);
      expect(result).toBe(
        JSON.stringify({
          frames: 4,
          differing: 0,
          reading: 'NOTHING CHANGED across 4.5s',
          shots: [frame1, frame2, frame3, frame4],
        }),
      );
    });

    it('VALID: {differing > 0, shotPath provided} => detects changing frames and returns still changing verdict', async () => {
      const proxy = stepHoldBrokerProxy();
      const lane = LaneSessionStub();
      const captureLiveMock = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: captureLiveMock });
      const shotPath = '/tmp/runs/run_1/step2.png';
      const index = 2;

      const frame1 = '/tmp/runs/run_1/step2_frame1.png';
      const frame2 = '/tmp/runs/run_1/step2_frame2.png';
      const frame3 = '/tmp/runs/run_1/step2_frame3.png';
      const frame4 = '/tmp/runs/run_1/step2_frame4.png';

      const whitePixels = new Uint8Array(400).fill(255);
      const changedPixels = new Uint8Array(400).fill(255);
      changedPixels[0] = 0;
      changedPixels[1] = 0;
      changedPixels[2] = 0;

      proxy.stagesShot({ path: frame1, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame2, width: 10, height: 10, pixels: changedPixels });
      proxy.stagesShot({ path: frame3, width: 10, height: 10, pixels: changedPixels });
      proxy.stagesShot({ path: frame4, width: 10, height: 10, pixels: whitePixels });
      proxy.succeedsCopy({ sourcePath: frame4, destinationPath: shotPath });

      const result = await stepHoldBroker({
        lane,
        session,
        index,
        shotPath,
        frames: 4,
        everyMs: 1500,
      });

      expect(result).toBe(
        JSON.stringify({
          frames: 4,
          differing: 2,
          reading: 'still changing at 4.5s',
          shots: [frame1, frame2, frame3, frame4],
        }),
      );
    });

    it('VALID: {shotPath is null} => places frames in lane.evidencePath and avoids copy', async () => {
      const proxy = stepHoldBrokerProxy();
      const lane = LaneSessionStub({
        evidencePath: '/tmp/evidence',
      });
      const captureLiveMock = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: captureLiveMock });
      const index = 3;

      const frame1 = '/tmp/evidence/step3_frame1.png';
      const frame2 = '/tmp/evidence/step3_frame2.png';

      const whitePixels = new Uint8Array(400).fill(255);
      proxy.stagesShot({ path: frame1, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame2, width: 10, height: 10, pixels: whitePixels });

      const result = await stepHoldBroker({
        lane,
        session,
        index,
        shotPath: null,
        frames: 2,
        everyMs: 1000,
      });

      expect(captureLiveMock.mock.calls).toStrictEqual([
        [{ filePath: frame1 }],
        [{ filePath: frame2 }],
      ]);
      expect(proxy.getCopiesFrom({ sourcePath: frame2 })).toStrictEqual([]);
      expect(result).toBe(
        JSON.stringify({
          frames: 2,
          differing: 0,
          reading: 'NOTHING CHANGED across 1s',
          shots: [frame1, frame2],
        }),
      );
    });
  });
});
