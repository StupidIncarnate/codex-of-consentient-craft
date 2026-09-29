/// <reference lib="dom" />
/**
 * PURPOSE: A real `Text` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/Text`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = TextStub();
 */
import { Text } from './Text';

export const TextStub = ({ data = 'hello' }: { data?: string } = {}): Text => new Text(data);
