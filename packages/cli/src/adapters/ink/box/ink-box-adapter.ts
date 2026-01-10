/**
 * PURPOSE: Provides Ink's Box component for use in widgets
 *
 * USAGE:
 * const Box = inkBoxAdapter();
 * <Box flexDirection="column">{children}</Box>
 */
import { Box } from 'ink';

export const inkBoxAdapter = (): typeof Box => Box;
