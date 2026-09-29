import { scrollReadingContract } from './scroll-reading-contract';
import { ScrollReadingStub } from './scroll-reading.stub';

describe('scrollReadingContract', () => {
  it('VALID: {a scrolled page} => parses every field', () => {
    const reading = ScrollReadingStub({
      scrollY: 400,
      scrollHeight: 900,
      viewportHeight: 500,
    });

    expect(scrollReadingContract.parse(reading)).toStrictEqual({
      scrollX: 0,
      scrollY: 400,
      scrollWidth: 1280,
      scrollHeight: 900,
      viewportWidth: 1280,
      viewportHeight: 500,
    });
  });

  it('INVALID: {scrollY: -1} => throws', () => {
    expect(() => scrollReadingContract.parse({ ...ScrollReadingStub(), scrollY: -1 })).toThrow(
      /Number must be greater than or equal to 0/u,
    );
  });

  it('INVALID: {an unknown key} => throws', () => {
    expect(() => scrollReadingContract.parse({ ...ScrollReadingStub(), extra: 1 })).toThrow(
      /Unrecognized key\(s\) in object: 'extra'/u,
    );
  });
});
