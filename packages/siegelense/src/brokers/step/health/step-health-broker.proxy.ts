/**
 * PURPOSE: Test setup helper for stepHealthBroker — composes shotBlankReadBrokerProxy so tests
 * driving stepHealthBroker with a shot path can stage real PNG frame data.
 *
 * USAGE:
 * const proxy = stepHealthBrokerProxy();
 * proxy.stagesShot({ shotPath, width: 4, height: 4, pixels: new Uint8Array([...]) });
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { shotBlankReadBrokerProxy } from '../../shot/blank-read/shot-blank-read-broker.proxy';

export const stepHealthBrokerProxy = (): {
  stagesShot: (params: {
    shotPath: AbsoluteFilePath;
    width: number;
    height: number;
    pixels: Uint8Array;
  }) => void;
  stagesDefaultShot: (params: { content: string }) => void;
  windowStart: (params?: {
    consoleLines?: number;
    networkLines?: number;
  }) => ReturnType<BrowserSession['bufferLengths']>;
} => {
  const blankProxy = shotBlankReadBrokerProxy();

  return {
    stagesShot: blankProxy.stagesShot,
    stagesDefaultShot: blankProxy.stagesDefaultShot,
    windowStart: ({
      consoleLines = 0,
      networkLines = 0,
    }: {
      consoleLines?: number;
      networkLines?: number;
    } = {}): ReturnType<BrowserSession['bufferLengths']> => {
      const base = BrowserSessionStub().bufferLengths();
      return {
        ...base,
        consoleLines: consoleLines as typeof base.consoleLines,
        networkLines: networkLines as typeof base.networkLines,
      };
    },
  };
};
