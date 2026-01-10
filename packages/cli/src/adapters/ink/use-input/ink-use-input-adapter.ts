/**
 * PURPOSE: Wraps ink's useInput hook for keyboard input handling in CLI widgets
 *
 * USAGE:
 * inkUseInputAdapter({handler: ({key}) => {
 *     if (key.upArrow) { // handle up arrow }
 * }});
 * // Registers keyboard handler in Ink React component
 */
import { useInput, type Key } from 'ink';

export type InkKey = Key;

export type InkInputHandler = ({ input, key }: { input: string; key: InkKey }) => void;

export const inkUseInputAdapter = ({ handler }: { handler: InkInputHandler }): void => {
  useInput((input: string, key: Key) => {
    handler({ input, key });
  });
};
