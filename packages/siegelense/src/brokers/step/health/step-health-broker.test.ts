import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { stepHealthBroker } from './step-health-broker';
import { stepHealthBrokerProxy } from './step-health-broker.proxy';

describe('stepHealthBroker', () => {
  it('VALID: {healthy state, shotPath null} => returns HEALTHY verdict string', async () => {
    stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
    );
  });

  it('VALID: {healthy state with non-blank shot} => captures shot and returns HEALTHY', async () => {
    const proxy = stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const captureMock = jest.fn().mockResolvedValue(undefined);
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
      capture: captureMock,
    });
    const shotPath = AbsoluteFilePathStub({ value: '/tmp/health-shot.png' });

    const backgroundPixel = [0x0d, 0x09, 0x07, 255];
    const foregroundPixel = [255, 255, 255, 255];
    const pixelRows = Array.from({ length: 16 }, () => backgroundPixel);
    pixelRows[7] = foregroundPixel;
    const pixels = new Uint8Array(pixelRows.flat());

    proxy.stagesShot({
      shotPath,
      width: 4,
      height: 4,
      pixels,
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath,
      browserWindowStart: null,
    });

    expect(captureMock).toHaveBeenCalledWith({ filePath: shotPath });
    expect(result).toBe(
      'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
    );
  });

  it('VALID: {root absent} => returns DOWN verdict', async () => {
    stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(false),
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'DOWN      root absent · not blank · console clean · no 5xx · server log clean',
    );
  });

  it('VALID: {blank page shot} => returns DOWN verdict with colour', async () => {
    const proxy = stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
    });
    const shotPath = AbsoluteFilePathStub({ value: '/tmp/blank-shot.png' });

    const backgroundPixel = [0x0d, 0x09, 0x07, 255];
    const pixels = new Uint8Array(Array.from({ length: 16 }, () => backgroundPixel).flat());

    proxy.stagesShot({
      shotPath,
      width: 4,
      height: 4,
      pixels,
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'DOWN      root present · page blank (#0d0907) · console clean · no 5xx · server log clean',
    );
  });

  it('VALID: {console error with json text} => returns DEGRADED verdict and error message', async () => {
    stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
      readConsoleSince: () => [
        ContentTextStub({
          value:
            '{"at":1,"kind":"console","type":"error","text":"Uncaught TypeError: cannot read properties of undefined"}',
        }),
      ],
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'DEGRADED  root present · not blank · console: 1 error "Uncaught TypeError: cannot read properties of undefined" · no 5xx · server log clean',
    );
  });

  it('VALID: {console error without json text} => falls back to whole line', async () => {
    stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
      readConsoleSince: () => [ContentTextStub({ value: '{"kind":"pageerror"}' })],
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'DEGRADED  root present · not blank · console: 1 error "{"kind":"pageerror"}" · no 5xx · server log clean',
    );
  });

  it('VALID: {network 5xx present} => returns DEGRADED verdict and first 5xx message', async () => {
    stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
      readNetworkSince: () => [
        ContentTextStub({
          value: '{"at":1,"method":"GET","url":"/api/guilds","status":500}',
        }),
      ],
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'DEGRADED  root present · not blank · console clean · network: 1 5xx "GET /api/guilds" · server log clean',
    );
  });

  it('VALID: {server error present} => returns DEGRADED verdict and server error count', async () => {
    stepHealthBrokerProxy();
    const lane = LaneSessionStub({
      readServerLogSince: () => [ContentTextStub({ value: 'panic: server error occurred' })],
    });
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
    });

    const result = await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart: null,
    });

    expect(result).toBe(
      'DEGRADED  root present · not blank · console clean · no 5xx · server log: 1 error',
    );
  });

  it('VALID: {browserWindowStart supplied} => offsets console and network line reading', async () => {
    const proxy = stepHealthBrokerProxy();
    const lane = LaneSessionStub();
    const readConsoleSince = jest.fn().mockReturnValue([]);
    const readNetworkSince = jest.fn().mockReturnValue([]);
    const session = BrowserSessionStub({
      checkRootPresent: jest.fn().mockResolvedValue(true),
      readConsoleSince,
      readNetworkSince,
    });

    const browserWindowStart = proxy.windowStart({ consoleLines: 5, networkLines: 10 });

    await stepHealthBroker({
      lane,
      session,
      shotPath: null,
      browserWindowStart,
    });

    expect(readConsoleSince).toHaveBeenCalledWith({ fromIndex: 5 });
    expect(readNetworkSince).toHaveBeenCalledWith({ fromIndex: 10 });
  });
});
