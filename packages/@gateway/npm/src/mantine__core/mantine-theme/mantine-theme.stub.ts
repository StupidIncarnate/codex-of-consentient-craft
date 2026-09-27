/**
 * PURPOSE: A real `MantineThemeOverride`, built through the real `createTheme()` — for a caller
 * staging this subpath's own value instead of hand-typing a fake theme object.
 *
 * USAGE:
 * const theme = MantineThemeStub();
 * // Returns a real theme override with the given primaryColor
 */
import { createTheme } from '@mantine/core';
import type { MantineThemeOverride } from '@mantine/core';

export const MantineThemeStub = ({
  primaryColor = 'blue',
}: { primaryColor?: string } = {}): MantineThemeOverride => createTheme({ primaryColor });
