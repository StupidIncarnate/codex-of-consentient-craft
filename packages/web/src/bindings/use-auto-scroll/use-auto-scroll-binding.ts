/**
 * PURPOSE: React hook that manages auto-scroll-to-bottom behavior with user scroll capture detection
 *
 * USAGE:
 * const { scrollContainerProps, scrollEndRef } = useAutoScrollBinding({ trigger: entries.length });
 * // Spread scrollContainerProps onto the scroll container, attach scrollEndRef to a sentinel div at the end
 */

import { useCallback, useEffect, useRef } from 'react';

import type { ScrollPositionPx } from '../../contracts/scroll-position-px/scroll-position-px-contract';
import { scrollThresholdPxContract } from '../../contracts/scroll-threshold-px/scroll-threshold-px-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { computeScrollCaptureTransformer } from '../../transformers/compute-scroll-capture/compute-scroll-capture-transformer';

const threshold = scrollThresholdPxContract.parse(raccoonAnimationConfigStatics.scrollThresholdPx);

export const useAutoScrollBinding = ({
  trigger,
}: {
  trigger: unknown;
}): {
  scrollContainerProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  scrollEndRef: React.RefObject<HTMLDivElement | null>;
} => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const isUserCapturingScroll = useRef(false);
  const lastScrollTopRef = useRef(0 as ScrollPositionPx);

  useEffect(() => {
    if (!isUserCapturingScroll.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [trigger]);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    const { isCapturing } = computeScrollCaptureTransformer({
      currentTop: target.scrollTop as ScrollPositionPx,
      lastTop: lastScrollTopRef.current,
      scrollHeight: target.scrollHeight as ScrollPositionPx,
      clientHeight: target.clientHeight as ScrollPositionPx,
      threshold,
      wasCapturing: isUserCapturingScroll.current,
    });
    isUserCapturingScroll.current = isCapturing;
    lastScrollTopRef.current = target.scrollTop as ScrollPositionPx;
  }, []);

  return {
    scrollContainerProps: {
      ref: scrollContainerRef,
      onScroll,
    },
    scrollEndRef,
  };
};
