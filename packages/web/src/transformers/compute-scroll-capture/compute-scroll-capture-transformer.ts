/**
 * PURPOSE: Determines whether a scroll event should capture (lock) auto-scroll based on scroll direction and position
 *
 * USAGE:
 * computeScrollCaptureTransformer({ currentTop, lastTop, scrollHeight, clientHeight, threshold, wasCapturing: false });
 * // Returns { isCapturing: true } — user scrolled upward away from bottom
 */

import type { ScrollPositionPx } from '../../contracts/scroll-position-px/scroll-position-px-contract';
import type { ScrollThresholdPx } from '../../contracts/scroll-threshold-px/scroll-threshold-px-contract';

export const computeScrollCaptureTransformer = ({
  currentTop,
  lastTop,
  scrollHeight,
  clientHeight,
  threshold,
  wasCapturing,
}: {
  currentTop: ScrollPositionPx;
  lastTop: ScrollPositionPx;
  scrollHeight: ScrollPositionPx;
  clientHeight: ScrollPositionPx;
  threshold: ScrollThresholdPx;
  wasCapturing: boolean;
}): { isCapturing: boolean } => {
  const isAtBottom = currentTop + clientHeight >= scrollHeight - threshold;

  if (isAtBottom) {
    return { isCapturing: false };
  }

  if (currentTop < lastTop) {
    return { isCapturing: true };
  }

  return { isCapturing: wasCapturing };
};
