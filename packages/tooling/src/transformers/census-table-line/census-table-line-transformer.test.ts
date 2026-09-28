import { censusTableLineTransformer } from './census-table-line-transformer';

describe('censusTableLineTransformer', () => {
  it('VALID: {cells: [a, bb], widths: [3, 2]} => pads the first column and joins with the gap', () => {
    const result = censusTableLineTransformer({ cells: ['a', 'bb'], widths: [3, 2] });

    expect(result).toBe('a    bb');
  });

  it('VALID: {a short last cell} => no trailing space after the last column', () => {
    const result = censusTableLineTransformer({ cells: ['a', 'b'], widths: [3, 4] });

    expect(result).toBe('a    b');
  });

  it('EDGE: {an empty last cell} => the row ends after the previous column', () => {
    const result = censusTableLineTransformer({ cells: ['a', ''], widths: [3, 4] });

    expect(result).toBe('a');
  });

  it('EMPTY: {no widths} => cells are not padded', () => {
    const result = censusTableLineTransformer({ cells: ['a', 'b'], widths: [] });

    expect(result).toBe('a  b');
  });
});
