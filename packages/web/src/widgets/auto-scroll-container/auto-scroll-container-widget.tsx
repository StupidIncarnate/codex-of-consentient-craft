/**
 * PURPOSE: Scrollable container that auto-scrolls to the bottom when content grows, pausing while the user scrolls up and resuming when they return to the bottom
 *
 * USAGE:
 * <AutoScrollContainerWidget style={{ flex: 1, padding: 16 }} contentStyle={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 *   {messages}
 * </AutoScrollContainerWidget>
 */

import type { CSSProperties, ReactNode } from 'react';

import { Box } from '@mantine/core';

import { useAutoScrollBinding } from '../../bindings/use-auto-scroll/use-auto-scroll-binding';
import type { TestId } from '../../contracts/test-id/test-id-contract';

export interface AutoScrollContainerWidgetProps {
  children: ReactNode;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
  testId?: TestId;
}

export const AutoScrollContainerWidget = ({
  children,
  style,
  contentStyle,
  testId,
}: AutoScrollContainerWidgetProps): React.JSX.Element => {
  const { scrollContainerProps, contentRef } = useAutoScrollBinding();

  return (
    <Box
      ref={scrollContainerProps.ref}
      onScroll={scrollContainerProps.onScroll}
      data-testid={testId}
      style={{ overflowY: 'auto', ...style }}
    >
      <div ref={contentRef} style={contentStyle}>
        {children}
      </div>
    </Box>
  );
};
