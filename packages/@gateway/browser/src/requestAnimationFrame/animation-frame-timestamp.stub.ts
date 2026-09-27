/**
 * PURPOSE: A real `DOMHighResTimeStamp`, captured from an actual scheduled call to
 * `#gateway/browser/requestAnimationFrame`'s own wrapped global — for a caller that needs a genuine
 * timestamp rather than a hand-typed number.
 *
 * USAGE:
 * const timestamp = await AnimationFrameTimestampStub();
 */
import { requestAnimationFrame } from './requestAnimationFrame';

export const AnimationFrameTimestampStub = async (): Promise<number> =>
  new Promise<number>((resolve) => {
    requestAnimationFrame((timestamp) => {
      resolve(timestamp);
    });
  });
