/// <reference lib="dom" />
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { Canvas2dContextStub } from '../canvas-2d-context.stub';

// jsdom's canvas has no 2D context (getContext answers null) and no encoder, so both are spied on
// the element prototype. Nothing is staged by default: an encode with no `stageEncode` for its
// (mediaType, quality) throws from the spy, and a context nobody staged is never handed out.
export const canvasEncodeProxy = (): {
  stageEncode: (params: { mediaType: string; quality: number; dataUrl: string }) => void;
  stageEncodeOnce: (params: { mediaType: string; quality: number; dataUrl: string }) => void;
  stageContextUnavailable: () => void;
  stageContextUnavailableOnce: () => void;
  getDrawCalls: () => readonly {
    image: unknown;
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
  }[];
  getEncodeRequests: () => readonly { mediaType: unknown; quality: unknown }[];
} => {
  const contextHandle: SpyOnHandle = registerSpyOn({
    object: HTMLCanvasElement.prototype,
    method: 'getContext',
  });
  const encodeHandle: SpyOnHandle = registerSpyOn({
    object: HTMLCanvasElement.prototype,
    method: 'toDataURL',
  });
  const drawCalls: {
    image: unknown;
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
  }[] = [];

  const stageContext = (): void => {
    const context = Canvas2dContextStub({
      onDraw: (draw): void => {
        drawCalls.push(draw);
      },
    });
    contextHandle.calledWith(['2d']).returns(context);
  };

  return {
    // Also stages the 2D context that records what is drawn. Call stageContextUnavailable AFTER it
    // to make getContext('2d') answer null instead: the most recent staging for an address wins.
    stageEncode: ({ mediaType, quality, dataUrl }): void => {
      stageContext();
      encodeHandle.calledWith([mediaType, quality]).returns(dataUrl);
    },
    // One answer per ask, consumed in staging order: a downscale ladder asks for the same
    // (mediaType, quality) several times and expects a different answer each time. Also stages
    // the recording 2D context.
    stageEncodeOnce: ({ mediaType, quality, dataUrl }): void => {
      stageContext();
      encodeHandle.onceFor([mediaType, quality]).returns(dataUrl);
    },
    stageContextUnavailable: (): void => {
      contextHandle.calledWith(['2d']).returns(null);
    },
    // The next `getContext('2d')` answers null, then the staged context answers again.
    stageContextUnavailableOnce: (): void => {
      contextHandle.onceFor(['2d']).returns(null);
    },
    getDrawCalls: () => drawCalls,
    getEncodeRequests: (): readonly { mediaType: unknown; quality: unknown }[] =>
      encodeHandle.callsMatching([]).map(([mediaType, quality]) => ({ mediaType, quality })),
  };
};
