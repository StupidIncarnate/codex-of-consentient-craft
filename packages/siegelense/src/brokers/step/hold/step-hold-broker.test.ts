import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { stepHoldBroker } from './step-hold-broker';
import { stepHoldBrokerProxy } from './step-hold-broker.proxy';

describe('stepHoldBroker', () => {
  describe('hold settlement detection', () => {
    it('VALID: {differing === 0, shotPath provided} => captures 4 frames live, copies final frame to shotPath, and returns NOTHING CHANGED verdict', async () => {
      const proxy = stepHoldBrokerProxy();
      const lane = LaneSessionStub();
      const captureLiveMock = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: captureLiveMock });
      const shotPath = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step1.png' });
      const index = StepIndexStub({ value: 1 });

      const frame1 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step1_frame1.png' });
      const frame2 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step1_frame2.png' });
      const frame3 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step1_frame3.png' });
      const frame4 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step1_frame4.png' });

      const whitePixels = new Uint8Array(400).fill(255);
      proxy.stagesShot({ path: frame1, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame2, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame3, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame4, width: 10, height: 10, pixels: whitePixels });
      proxy.succeedsCopy({ sourcePath: frame4 });

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
      expect(proxy.getDestinationPathFor({ sourcePath: frame4 })).toBe(shotPath);
      expect(result).toBe(
        JSON.stringify({
          frames: 4,
          differing: 0,
          verdict: 'NOTHING CHANGED across 4.5s',
          shots: [frame1, frame2, frame3, frame4],
        }),
      );
    });

    it('VALID: {differing > 0, shotPath provided} => detects changing frames and returns still changing verdict', async () => {
      const proxy = stepHoldBrokerProxy();
      const lane = LaneSessionStub();
      const captureLiveMock = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: captureLiveMock });
      const shotPath = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step2.png' });
      const index = StepIndexStub({ value: 2 });

      const frame1 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step2_frame1.png' });
      const frame2 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step2_frame2.png' });
      const frame3 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step2_frame3.png' });
      const frame4 = AbsoluteFilePathStub({ value: '/tmp/runs/run_1/step2_frame4.png' });

      const whitePixels = new Uint8Array(400).fill(255);
      const changedPixels = new Uint8Array(400).fill(255);
      changedPixels[0] = 0;
      changedPixels[1] = 0;
      changedPixels[2] = 0;

      proxy.stagesShot({ path: frame1, width: 10, height: 10, pixels: whitePixels });
      proxy.stagesShot({ path: frame2, width: 10, height: 10, pixels: changedPixels });
      proxy.stagesShot({ path: frame3, width: 10, height: 10, pixels: changedPixels });
      proxy.stagesShot({ path: frame4, width: 10, height: 10, pixels: whitePixels });
      proxy.succeedsCopy({ sourcePath: frame4 });

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
          verdict: 'still changing at 4.5s',
          shots: [frame1, frame2, frame3, frame4],
        }),
      );
    });

    it('VALID: {shotPath is null} => places frames in lane.evidencePath and avoids copy', async () => {
      const proxy = stepHoldBrokerProxy();
      const lane = LaneSessionStub({
        evidencePath: AbsoluteFilePathStub({ value: '/tmp/evidence' }),
      });
      const captureLiveMock = jest.fn().mockResolvedValue(undefined);
      const session = BrowserSessionStub({ captureLive: captureLiveMock });
      const index = StepIndexStub({ value: 3 });

      const frame1 = AbsoluteFilePathStub({ value: '/tmp/evidence/step3_frame1.png' });
      const frame2 = AbsoluteFilePathStub({ value: '/tmp/evidence/step3_frame2.png' });

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
      expect(proxy.getDestinationPathFor({ sourcePath: frame2 })).toBe(undefined);
      expect(result).toBe(
        JSON.stringify({
          frames: 2,
          differing: 0,
          verdict: 'NOTHING CHANGED across 1s',
          shots: [frame1, frame2],
        }),
      );
    });
  });
});
