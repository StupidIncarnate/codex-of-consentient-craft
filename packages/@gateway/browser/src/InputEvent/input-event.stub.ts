/// <reference lib="dom" />
/**
 * PURPOSE: A real `InputEvent` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/InputEvent`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = InputEventStub();
 */
import { InputEvent } from './InputEvent';

export const InputEventStub = ({
  type = 'beforeinput',
  data = 'a',
  inputType = 'insertText',
}: { type?: string; data?: string; inputType?: string } = {}): InputEvent =>
  new InputEvent(type, { data, inputType, cancelable: true });
