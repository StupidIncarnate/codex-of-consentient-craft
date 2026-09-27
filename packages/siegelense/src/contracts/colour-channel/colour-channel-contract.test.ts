import { colourChannelContract } from './colour-channel-contract';
import { ColourChannelStub } from './colour-channel.stub';

describe('colourChannelContract', () => {
  it('VALID: {value: 0} => parses the lowest 8-bit channel value', () => {
    const result = ColourChannelStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 255} => parses the highest 8-bit channel value', () => {
    const result = ColourChannelStub({ value: 255 });

    expect(result).toBe(255);
  });

  it('VALID: {value: 13} => parses a mid-range channel value', () => {
    const result = ColourChannelStub({ value: 13 });

    expect(result).toBe(13);
  });

  it('INVALID: {value: 256} => throws, one past the 8-bit ceiling', () => {
    expect(() => colourChannelContract.parse(256)).toThrow(/Too big: expected number to be <=255/u);
  });

  it('INVALID: {value: -1} => throws for a negative channel', () => {
    expect(() => colourChannelContract.parse(-1)).toThrow(/expected number to be >=0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => colourChannelContract.parse(1.5)).toThrow(/expected int, received number/u);
  });
});
