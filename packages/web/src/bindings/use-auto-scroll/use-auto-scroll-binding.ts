/**
 * PURPOSE: React hook that auto-scrolls a container to the bottom when its content grows, while letting the user pause it by scrolling up
 *
 * USAGE:
 * const { scrollContainerProps, contentRef } = useAutoScrollBinding();
 * // Spread scrollContainerProps onto the scrollable element, attach contentRef to the inner content wrapper that grows
 */

import { useCallback, useEffect, useRef } from 'react';

import type { ScrollPositionPx } from '../../contracts/scroll-position-px/scroll-position-px-contract';
import { scrollThresholdPxContract } from '../../contracts/scroll-threshold-px/scroll-threshold-px-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { computeScrollCaptureTransformer } from '../../transformers/compute-scroll-capture/compute-scroll-capture-transformer';

const threshold = scrollThresholdPxContract.parse(raccoonAnimationConfigStatics.scrollThresholdPx);

export const useAutoScrollBinding = (): {
  scrollContainerProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  contentRef: React.RefObject<HTMLDivElement | null>;
} => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isUserCapturingScroll = useRef(false);
  const lastScrollTopRef = useRef(0 as ScrollPositionPx);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return (): void => {
        // No-op cleanup — refs not attached yet
      };
    }

    const observer = new ResizeObserver(() => {
      if (!isUserCapturingScroll.current) {
        container.scrollTop = container.scrollHeight;
      }
    });
    observer.observe(content);
    return (): void => {
      observer.disconnect();
    };
  }, []);

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
    contentRef,
  };
};
