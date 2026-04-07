import { ScrollPositionPxStub } from '../../contracts/scroll-position-px/scroll-position-px.stub';
import { ScrollThresholdPxStub } from '../../contracts/scroll-threshold-px/scroll-threshold-px.stub';
import { computeScrollCaptureTransformer } from './compute-scroll-capture-transformer';

const ComputeScrollCaptureParamsStub = (
  overrides: Partial<Parameters<typeof computeScrollCaptureTransformer>[0]> = {},
): Parameters<typeof computeScrollCaptureTransformer>[0] => ({
  scrollHeight: ScrollPositionPxStub({ value: 1000 }),
  clientHeight: ScrollPositionPxStub({ value: 400 }),
  threshold: ScrollThresholdPxStub(),
  currentTop: ScrollPositionPxStub(),
  lastTop: ScrollPositionPxStub(),
  wasCapturing: false,
  ...overrides,
});

describe('computeScrollCaptureTransformer', () => {
  describe('captures scroll (locks auto-scroll off)', () => {
    it('VALID: {user scrolls upward, not at bottom} => captures', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: ScrollPositionPxStub({ value: 200 }),
          lastTop: ScrollPositionPxStub({ value: 250 }),
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: true });
    });

    it('VALID: {already capturing, user scrolls down but not to bottom} => stays captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: ScrollPositionPxStub({ value: 300 }),
          lastTop: ScrollPositionPxStub({ value: 200 }),
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: true });
    });

    it('VALID: {already capturing, content grows} => stays captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          scrollHeight: ScrollPositionPxStub({ value: 1500 }),
          currentTop: ScrollPositionPxStub({ value: 300 }),
          lastTop: ScrollPositionPxStub({ value: 300 }),
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
          currentTop: ScrollPositionPxStub({ value: 595 }),
          lastTop: ScrollPositionPxStub({ value: 500 }),
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });

    it('VALID: {at bottom within threshold} => releases', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: ScrollPositionPxStub({ value: 591 }),
          lastTop: ScrollPositionPxStub({ value: 580 }),
          wasCapturing: true,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });

    it('VALID: {programmatic scroll to exact bottom} => releases', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: ScrollPositionPxStub({ value: 600 }),
          lastTop: ScrollPositionPxStub(),
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
          currentTop: ScrollPositionPxStub({ value: 300 }),
          lastTop: ScrollPositionPxStub({ value: 200 }),
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });

    it('VALID: {scroll position unchanged, was not capturing} => stays not captured', () => {
      const result = computeScrollCaptureTransformer(
        ComputeScrollCaptureParamsStub({
          currentTop: ScrollPositionPxStub({ value: 200 }),
          lastTop: ScrollPositionPxStub({ value: 200 }),
          wasCapturing: false,
        }),
      );

      expect(result).toStrictEqual({ isCapturing: false });
    });
  });
});
