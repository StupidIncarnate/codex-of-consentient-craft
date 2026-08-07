import { iconButtonSizeContract } from './icon-button-size-contract';
import { IconButtonSizeStub } from './icon-button-size.stub';

describe('iconButtonSizeContract', () => {
  describe('valid input', () => {
    it.each(iconButtonSizeContract.unwrap().options)(
      'VALID: {value: %s} => returns the branded size',
      (value) => {
        expect(String(IconButtonSizeStub({ value }))).toBe(value);
      },
    );
  });

  describe('invalid input', () => {
    it('INVALID: {value: "small"} => throws an enum error', () => {
      expect(() => IconButtonSizeStub({ value: 'small' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: 20} => throws a type error', () => {
      expect(() => IconButtonSizeStub({ value: 20 as never })).toThrow(/Expected 'xs' \| 'sm'/u);
    });

    it('EMPTY: {value: ""} => throws an enum error', () => {
      expect(() => IconButtonSizeStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
