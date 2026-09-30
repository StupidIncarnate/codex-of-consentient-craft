import { computeScrollCaptureTransformer } from './compute-scroll-capture-transformer';

const ComputeScrollCaptureParamsStub = (
  overrides: Partial<Parameters<typeof computeScrollCaptureTransformer>[0]> = {},
): Parameters<typeof computeScrollCaptureTransformer>[0] => ({
  scrollHeight: 1000,
  clientHeight: 400,
  threshold: 10,
  currentTop: 0,
  lastTop: 0,
  wasCapturing: false,
  ...overrides,
});

describe('computeScrollCaptureTransformer', () => {
  describe('captures scroll (locks auto-scroll off)', () => {
    it('VALID: {user scrolls upward, not at bottom} => captures', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 200,
          lastTop: 250,
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: true });
    });

    it('VALID: {already capturing, user scrolls down but not to bottom} => stays captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 300,
          lastTop: 200,
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: true });
    });

    it('VALID: {already capturing, content grows} => stays captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          scrollHeight: 1500,
          currentTop: 300,
          lastTop: 300,
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: true });
    });
  });

  describe('releases scroll (re-enables auto-scroll)', () => {
    it('VALID: {user scrolls all the way to bottom} => releases', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 595,
          lastTop: 500,
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });

    it('VALID: {at bottom within threshold} => releases', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 591,
          lastTop: 580,
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });

    it('VALID: {programmatic scroll to exact bottom} => releases', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 600,
          lastTop: 0,
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });
  });

  describe('does not capture on programmatic scroll', () => {
    it('VALID: {scroll moves down, not at bottom, was not capturing} => stays not captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 300,
          lastTop: 200,
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });

    it('VALID: {scroll position unchanged, was not capturing} => stays not captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: 200,
          lastTop: 200,
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });
  });
});
