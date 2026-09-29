import { InputEvent } from './InputEvent';
import { InputEventStub } from './input-event.stub';

describe('InputEventStub', () => {
  it('VALID: {given fields} => a real InputEvent carrying them', () => {
    const event = InputEventStub({ type: 'input', data: 'z', inputType: 'insertFromPaste' });

    expect({
      isInputEvent: event instanceof InputEvent,
      type: event.type,
      data: event.data,
      inputType: event.inputType,
    }).toStrictEqual({
      isInputEvent: true,
      type: 'input',
      data: 'z',
      inputType: 'insertFromPaste',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const event = InputEventStub();

    expect({
      type: event.type,
      data: event.data,
      inputType: event.inputType,
      cancelable: event.cancelable,
    }).toStrictEqual({ type: 'beforeinput', data: 'a', inputType: 'insertText', cancelable: true });
  });
});
