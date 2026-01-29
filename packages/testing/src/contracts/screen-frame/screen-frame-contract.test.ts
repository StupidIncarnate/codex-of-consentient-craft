import { screenFrameContract } from './screen-frame-contract';
import { ScreenFrameStub } from './screen-frame.stub';

describe('screenFrameContract', () => {
  it('VALID: {string value} => parses successfully', () => {
    const result = screenFrameContract.parse('terminal output');

    expect(result).toBe('terminal output');
  });

  it('VALID: {multiline string} => parses with newlines', () => {
    const frame = '┌──────────┐\n│  Menu    │\n└──────────┘';

    const result = screenFrameContract.parse(frame);

    expect(result).toBe(frame);
  });

  it('INVALID: {non-string} => throws ZodError', () => {
    expect(() => screenFrameContract.parse(123)).toThrow('Expected string');
  });
});

describe('ScreenFrameStub', () => {
  it('VALID: {no args} => returns default menu frame', () => {
    const result = ScreenFrameStub();

    expect(result).toBe('┌──────────┐\n│  Menu    │\n└──────────┘');
  });

  it('VALID: {custom value} => returns specified frame', () => {
    const result = ScreenFrameStub({ value: 'custom output' });

    expect(result).toBe('custom output');
  });
});
