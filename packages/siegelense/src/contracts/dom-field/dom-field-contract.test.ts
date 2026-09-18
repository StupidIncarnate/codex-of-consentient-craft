import { domFieldContract } from './dom-field-contract';
import { DomFieldStub } from './dom-field.stub';

describe('domFieldContract', () => {
  it('VALID: {default stub} => parses "text"', () => {
    const field = DomFieldStub();

    const result = domFieldContract.parse(field);

    expect(result).toBe('text');
  });

  it('VALID: {value: "count"} => parses "count"', () => {
    const field = DomFieldStub({ value: 'count' });

    const result = domFieldContract.parse(field);

    expect(result).toBe('count');
  });

  it('VALID: {value: "rect"} => parses "rect"', () => {
    const field = DomFieldStub({ value: 'rect' });

    const result = domFieldContract.parse(field);

    expect(result).toBe('rect');
  });

  it('INVALID: {value: "invalid"} => throws ZodError for unrecognized field name', () => {
    expect(() => {
      domFieldContract.parse('invalid');
    }).toThrow(/Invalid enum value/u);
  });
});
