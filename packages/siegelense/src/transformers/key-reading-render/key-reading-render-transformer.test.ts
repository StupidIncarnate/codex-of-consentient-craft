import { FocusedElementStub } from '../../contracts/focused-element/focused-element.stub';
import { KeyReadingStub } from '../../contracts/key-reading/key-reading.stub';
import { keyReadingRenderTransformer } from './key-reading-render-transformer';

describe('keyReadingRenderTransformer', () => {
  it('VALID: {focused: null} => formats nothing focused', () => {
    const reading = KeyReadingStub({
      press: 'Enter',
      focused: null,
    });

    const result = keyReadingRenderTransformer({ reading });

    expect(result).toBe('pressed "Enter" — nothing focused');
  });

  it('VALID: {focused: element with testId, text, ref} => formats full element description', () => {
    const reading = KeyReadingStub({
      press: 'Tab',
      focused: FocusedElementStub({
        tag: 'input',
        testId: 'NAME_INPUT',
        text: 'alice',
        ref: 14,
      }),
    });

    const result = keyReadingRenderTransformer({ reading });

    expect(result).toBe(
      'pressed "Tab" — focused: input[data-testid="NAME_INPUT"] "alice" (ref 14)',
    );
  });

  it('VALID: {focused: element with tag only} => formats tag only', () => {
    const reading = KeyReadingStub({
      press: 'ArrowDown',
      focused: FocusedElementStub({
        tag: 'button',
      }),
    });

    const result = keyReadingRenderTransformer({ reading });

    expect(result).toBe('pressed "ArrowDown" — focused: button');
  });

  it('VALID: {focused: element with domId and role} => formats domId and role', () => {
    const reading = KeyReadingStub({
      press: 'Escape',
      focused: FocusedElementStub({
        tag: 'div',
        domId: 'dropdown-menu',
        role: 'menu',
      }),
    });

    const result = keyReadingRenderTransformer({ reading });

    expect(result).toBe('pressed "Escape" — focused: div#dropdown-menu[role="menu"]');
  });
});
