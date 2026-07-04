import { AdapterResultStub } from '@dungeonmaster/shared/contracts';

import { questNodeDispatchRunnerBroker } from './quest-node-dispatch-runner-broker';
import { questNodeDispatchRunnerBrokerProxy } from './quest-node-dispatch-runner-broker.proxy';

describe('questNodeDispatchRunnerBroker', () => {
  describe('start / stop', () => {
    it('VALID: {start} => registers wake handler via onWake', () => {
      questNodeDispatchRunnerBrokerProxy();
      const onWake = jest.fn();

      const runner = questNodeDispatchRunnerBroker({
        onWake,
        offWake: jest.fn(),
        runLoop: jest.fn().mockResolvedValue(AdapterResultStub()),
      });

      runner.start();

      expect(onWake.mock.calls).toStrictEqual([[{ handler: expect.any(Function) }]]);
    });

    it('VALID: {start twice} => only registers handler once', () => {
      questNodeDispatchRunnerBrokerProxy();
      const onWake = jest.fn();

      const runner = questNodeDispatchRunnerBroker({
        onWake,
        offWake: jest.fn(),
        runLoop: jest.fn().mockResolvedValue(AdapterResultStub()),
      });

      runner.start();
      runner.start();

      expect(onWake.mock.calls).toStrictEqual([[{ handler: expect.any(Function) }]]);
    });

    it('VALID: {stop after start} => deregisters the same handler via offWake', () => {
      questNodeDispatchRunnerBrokerProxy();
      const onWake = jest.fn();
      const offWake = jest.fn();

      const runner = questNodeDispatchRunnerBroker({
        onWake,
        offWake,
        runLoop: jest.fn().mockResolvedValue(AdapterResultStub()),
      });

      runner.start();
      runner.stop();

      const [[registered]] = onWake.mock.calls as [[{ handler: () => void }]];

      expect(offWake.mock.calls).toStrictEqual([[{ handler: registered.handler }]]);
    });

    it('VALID: {stop without start} => does not call offWake', () => {
      questNodeDispatchRunnerBrokerProxy();
      const offWake = jest.fn();

      const runner = questNodeDispatchRunnerBroker({
        onWake: jest.fn(),
        offWake,
        runLoop: jest.fn().mockResolvedValue(AdapterResultStub()),
      });

      runner.stop();

      expect(offWake.mock.calls).toStrictEqual([]);
    });
  });

  describe('kick single-flight', () => {
    it('VALID: {kick} => runs the loop once', async () => {
      questNodeDispatchRunnerBrokerProxy();
      const runLoop = jest.fn().mockResolvedValue(AdapterResultStub());

      const runner = questNodeDispatchRunnerBroker({
        onWake: jest.fn(),
        offWake: jest.fn(),
        runLoop,
      });

      await runner.kick();

      expect(runLoop.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {kick while running} => coalesces into one follow-up loop run', async () => {
      questNodeDispatchRunnerBrokerProxy();
      const gate = new Map<'release', () => void>();
      const runLoop = jest
        .fn()
        .mockImplementationOnce(
          async () =>
            new Promise((resolve) => {
              gate.set('release', (): void => {
                resolve(AdapterResultStub());
              });
            }),
        )
        .mockResolvedValue(AdapterResultStub());

      const runner = questNodeDispatchRunnerBroker({
        onWake: jest.fn(),
        offWake: jest.fn(),
        runLoop,
      });

      const firstKick = runner.kick();
      const secondKick = runner.kick();
      const thirdKick = runner.kick();
      gate.get('release')?.();
      await Promise.all([firstKick, secondKick, thirdKick]);

      expect(runLoop.mock.calls).toStrictEqual([[], []]);
    });

    it('VALID: {wake handler fires} => kicks the loop', async () => {
      questNodeDispatchRunnerBrokerProxy();
      const onWake = jest.fn();
      const runLoop = jest.fn().mockResolvedValue(AdapterResultStub());

      const runner = questNodeDispatchRunnerBroker({
        onWake,
        offWake: jest.fn(),
        runLoop,
      });
      runner.start();

      const [[registered]] = onWake.mock.calls as [[{ handler: () => void }]];
      registered.handler();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(runLoop.mock.calls).toStrictEqual([[]]);
    });

    it('ERROR: {runLoop rejects} => kick releases the single-flight lock for the next kick', async () => {
      questNodeDispatchRunnerBrokerProxy();
      const runLoop = jest
        .fn()
        .mockRejectedValueOnce(new Error('scan blew up'))
        .mockResolvedValue(AdapterResultStub());

      const runner = questNodeDispatchRunnerBroker({
        onWake: jest.fn(),
        offWake: jest.fn(),
        runLoop,
      });

      await expect(runner.kick()).rejects.toThrow(/^scan blew up$/u);

      await runner.kick();

      expect(runLoop.mock.calls).toStrictEqual([[], []]);
    });
  });
});
