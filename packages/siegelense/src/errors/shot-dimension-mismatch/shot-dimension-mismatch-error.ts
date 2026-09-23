/**
 * PURPOSE: Represents an error when two captures being compared for `pixelChange` have different
 * pixel dimensions. No `resize` step exists yet and the viewport is fixed, so two captures of one
 * instance differing in size is a defect in this tool, not a reading — inventing a percentage would
 * hide the bug and have to be unwound the day `resize` lands. Names both paths and both sizes rather
 * than folding them into one string, so a caller reporting the failure can print either half alone.
 *
 * USAGE:
 * throw new ShotDimensionMismatchError({
 *   previousPath: '/repo/.dungeonmaster-assets/siegelense-assets/.../run_1/step2.png',
 *   currentPath: '/repo/.dungeonmaster-assets/siegelense-assets/.../run_2/step1.png',
 *   previousSize: '1280x720',
 *   currentSize: '1024x768',
 * });
 * // Throws error naming both paths and both sizes
 *
 * WHEN-TO-USE: From the pixel-diff broker, once two decoded PNGs report different width/height,
 * so a caller can `instanceof`-check it to distinguish a sizing defect from a real pixel difference.
 * WHEN-NOT-TO-USE: When both captures share one viewport size — pixelChange proceeds and never
 * throws.
 */
export class ShotDimensionMismatchError extends Error {
  public constructor({
    previousPath,
    currentPath,
    previousSize,
    currentSize,
  }: {
    previousPath: string;
    currentPath: string;
    previousSize: string;
    currentSize: string;
  }) {
    super(
      `Shot dimension mismatch: ${previousPath} is ${previousSize} but ${currentPath} is ${currentSize} — pixelChange cannot compare captures of different sizes`,
    );
    this.name = 'ShotDimensionMismatchError';
  }
}
