/**
 * PURPOSE: Provides Ink's Text component for use in widgets
 *
 * USAGE:
 * const Text = inkTextAdapter();
 * <Text bold>Hello World</Text>
 */
import { Text } from 'ink';

export const inkTextAdapter = (): typeof Text => Text;
