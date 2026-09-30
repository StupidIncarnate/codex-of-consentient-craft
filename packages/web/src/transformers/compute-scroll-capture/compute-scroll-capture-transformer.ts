/**
 * PURPOSE: Determines whether a scroll event should capture (lock) auto-scroll based on scroll direction and position
 *
 * USAGE:
 * computeScrollCaptureTransformer({ currentTop, lastTop, scrollHeight, clientHeight, threshold, wasCapturing: false });
 * // Returns { isCapturing: true } — user scrolled upward away from bottom
 */


export const computeScrollCaptureTransformer = ({
  currentTop,
  lastTop,
  scrollHeight,
  clientHeight,
  threshold,
  wasCapturing,
}: {
  currentTop: number;
  lastTop: number;
  scrollHeight: number;
  clientHeight: number;
  threshold: number;
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
