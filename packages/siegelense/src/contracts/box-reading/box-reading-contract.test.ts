import { boxReadingContract } from './box-reading-contract';
import { BoxReadingStub } from './box-reading.stub';

describe('boxReadingContract', () => {
  describe('valid values', () => {
    it('VALID: {complete reading} => parses and returns exact BoxReading shape', () => {
      const reading = BoxReadingStub();

      const result = boxReadingContract.parse(reading);

      expect(result).toStrictEqual({
        ref: 26,
        x: 607,
        y: 472,
        width: 66,
        height: 27,
        viewport: { width: 1280, height: 720 },
        visible: true,
        inViewport: true,
      });
    });

    it('VALID: {negative coordinates} => parses an element positioned offscreen left or top', () => {
      const reading = BoxReadingStub({
        x: -50,
        y: -10,
        inViewport: false,
      });

      const result = boxReadingContract.parse(reading);

      expect(result).toStrictEqual({
        ref: 26,
        x: -50,
        y: -10,
        width: 66,
        height: 27,
        viewport: { width: 1280, height: 720 },
        visible: true,
        inViewport: false,
      });
    });

    it('VALID: {zero dimensions} => parses an element with zero width and height', () => {
      const reading = BoxReadingStub({
        width: 0,
        height: 0,
        visible: false,
      });

      const result = boxReadingContract.parse(reading);

      expect(result).toStrictEqual({
        ref: 26,
        x: 607,
        y: 472,
        width: 0,
        height: 0,
        viewport: { width: 1280, height: 720 },
        visible: false,
        inViewport: true,
      });
    });
  });

  describe('invalid values', () => {
    it('INVALID: {negative width} => throws for negative width', () => {
      expect(() =>
        boxReadingContract.parse({
          ref: 1,
          x: 0,
          y: 0,
          width: -1,
          height: 10,
          viewport: { width: 1280, height: 720 },
          visible: true,
          inViewport: true,
        }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: {extra property} => throws due to strict schema', () => {
      expect(() =>
        boxReadingContract.parse({
          ...BoxReadingStub(),
          unexpected: 'extra',
        }),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {ref 0} => throws for non-positive ref', () => {
      expect(() =>
        boxReadingContract.parse({
          ...BoxReadingStub(),
          ref: 0,
        }),
      ).toThrow(/Number must be greater than 0/u);
    });
  });
});
