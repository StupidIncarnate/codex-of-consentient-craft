import { domRectContract } from './dom-rect-contract';
import { DomRectStub } from './dom-rect.stub';

describe('domRectContract', () => {
  it('VALID: {default stub} => parses exact DomRect shape', () => {
    const rect = DomRectStub();

    const result = domRectContract.parse(rect);

    expect(result).toStrictEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  it('VALID: {negative coordinates} => parses negative x and y', () => {
    const rect = DomRectStub({ x: -15, y: -25 });

    const result = domRectContract.parse(rect);

    expect(result).toStrictEqual({
      x: -15,
      y: -25,
      width: 100,
      height: 50,
    });
  });

  it('INVALID: {negative width} => throws validation error', () => {
    expect(() => {
      domRectContract.parse({ x: 0, y: 0, width: -10, height: 50 });
    }).toThrow(/Number must be greater than or equal to 0/u);
  });
});
