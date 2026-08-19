import { sadRaccoonPixelsStatics } from './sad-raccoon-pixels-statics';
import { raccoonWizardPixelsStatics } from '../raccoon-wizard-pixels/raccoon-wizard-pixels-statics';

describe('sadRaccoonPixelsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(sadRaccoonPixelsStatics).toStrictEqual({
      dimensions: {
        width: 21,
        height: 15,
      },
      pixels: [
        '5 5 #8a8a9a',
        '6 5 #8a8a9a',
        '6 6 #8a8a9a',
        '7 6 #8a8a9a',
        '8 6 #8a8a9a',
        '9 7 #8a8a9a',
        '10 7 #8a8a9a',
        '11 7 #8a8a9a',
        '12 7 #8a8a9a',
        '13 7 #8a8a9a',
        '13 6 #6a6a7a',
        '14 7 #6a6a7a',
        '14 6 #8a8a9a',
        '15 6 #8a8a9a',
        '15 7 #8a8a9a',
        '16 7 #8a8a9a',
        '17 7 #8a8a9a',
        '18 7 #8a8a9a',
        '15 8 #8a8a9a',
        '16 8 #8a8a9a',
        '17 8 #8a8a9a',
        '18 8 #8a8a9a',
        '19 8 #8a8a9a',
        '15 9 #8a8a9a',
        '16 9 #4a4a5a',
        '17 9 #8a8a9a',
        '18 9 #8a8a9a',
        '19 9 #8a8a9a',
        '14 10 #4a4a5a',
        '15 10 #4a4a5a',
        '16 10 #e0e0e0',
        '17 10 #4a4a5a',
        '18 10 #c8c8d4',
        '19 10 #c8c8d4',
        '16 11 #c8c8d4',
        '17 11 #c8c8d4',
        '18 11 #c8c8d4',
        '19 11 #1a1a2a',
        '6 8 #8a8a9a',
        '7 8 #8a8a9a',
        '8 8 #8a8a9a',
        '9 8 #8a8a9a',
        '10 8 #8a8a9a',
        '11 8 #8a8a9a',
        '12 8 #8a8a9a',
        '13 8 #8a8a9a',
        '14 8 #8a8a9a',
        '6 9 #8a8a9a',
        '7 9 #8a8a9a',
        '8 9 #c8c8d4',
        '9 9 #c8c8d4',
        '10 9 #c8c8d4',
        '11 9 #c8c8d4',
        '12 9 #8a8a9a',
        '13 9 #8a8a9a',
        '14 9 #8a8a9a',
        '6 10 #8a8a9a',
        '7 10 #8a8a9a',
        '8 10 #c8c8d4',
        '9 10 #c8c8d4',
        '10 10 #c8c8d4',
        '11 10 #c8c8d4',
        '12 10 #8a8a9a',
        '13 10 #8a8a9a',
        '6 11 #6a6a7a',
        '7 11 #6a6a7a',
        '8 11 #8a8a9a',
        '9 11 #8a8a9a',
        '10 11 #8a8a9a',
        '11 11 #8a8a9a',
        '12 11 #8a8a9a',
        '13 11 #6a6a7a',
        '5 8 #4a4a5a',
        '4 9 #4a4a5a',
        '5 9 #4a4a5a',
        '3 10 #c8c8d4',
        '4 10 #c8c8d4',
        '2 11 #c8c8d4',
        '3 11 #c8c8d4',
        '1 12 #4a4a5a',
        '2 12 #4a4a5a',
        '1 13 #4a4a5a',
        '2 13 #4a4a5a',
        '1 14 #c8c8d4',
        '2 14 #c8c8d4',
        '6 12 #8a8a9a',
        '7 12 #8a8a9a',
        '12 12 #8a8a9a',
        '5 13 #8a8a9a',
        '6 13 #8a8a9a',
        '12 13 #8a8a9a',
        '13 13 #8a8a9a',
        '14 13 #8a8a9a',
        '4 14 #5a5a6a',
        '5 14 #5a5a6a',
        '13 14 #5a5a6a',
        '14 14 #5a5a6a',
        '15 14 #5a5a6a',
      ],
    });
  });

  it('VALID: {dimensions} => equal raccoonWizardPixelsStatics.dimensions so both poses are interchangeable in PixelSpriteWidget', () => {
    expect(sadRaccoonPixelsStatics.dimensions).toStrictEqual(raccoonWizardPixelsStatics.dimensions);
  });

  it('VALID: {every pixel} => matches the "<x> <y> #rrggbb" format PixelSpriteWidget splits on', () => {
    // Cannot import pixelCoordinateContract here (a statics test may only import statics/),
    // so this regex is kept identical to pixelCoordinateContract's by hand.
    const nonMatching = sadRaccoonPixelsStatics.pixels.filter(
      (pixel) => !/^\d+ \d+ #[0-9a-fA-F]{6}$/u.test(pixel),
    );

    expect(nonMatching).toStrictEqual([]);
  });

  it('EDGE: {every coordinate} => falls inside the 21x15 grid', () => {
    const { width, height } = sadRaccoonPixelsStatics.dimensions;
    const xOutOfBounds = sadRaccoonPixelsStatics.pixels.filter(
      (pixel) => Number(pixel.split(' ')[0]) >= width,
    );
    const yOutOfBounds = sadRaccoonPixelsStatics.pixels.filter(
      (pixel) => Number(pixel.split(' ')[1]) >= height,
    );

    expect(xOutOfBounds.concat(yOutOfBounds)).toStrictEqual([]);
  });

  it('EDGE: {no two entries} => paint the same cell', () => {
    const cells = new Set(
      sadRaccoonPixelsStatics.pixels.map((pixel) => pixel.split(' ').slice(0, 2).join(' ')),
    );

    expect(cells.size).toBe(sadRaccoonPixelsStatics.pixels.length);
  });

  it('VALID: {every colour} => also appears in raccoonWizardPixelsStatics, so the sad pose reuses the established raccoon palette', () => {
    const wizardColors = new Set(
      raccoonWizardPixelsStatics.pixels.map((pixel) => pixel.split(' ')[2]),
    );
    const unknownColors = sadRaccoonPixelsStatics.pixels.filter(
      (pixel) => !wizardColors.has(pixel.split(' ')[2]),
    );

    expect(unknownColors).toStrictEqual([]);
  });

  it("VALID: {rows 0-3} => are empty, unlike the wizard's arched tail and pointed hat", () => {
    const rowsZeroToThree = sadRaccoonPixelsStatics.pixels.filter(
      (pixel) => Number(pixel.split(' ')[1]) < 4,
    );

    expect(rowsZeroToThree).toStrictEqual([]);
  });
});
