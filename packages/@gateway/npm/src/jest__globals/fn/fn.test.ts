import { fn } from './fn';

const mock = fn();

describe('#gateway/npm/jest__globals fn', () => {
  it('VALID: {} => a real jest mock function that tracks calls and returns a staged value', () => {
    mock.mockReturnValue('staged');

    const result = mock('a', 'b');

    expect(result).toBe('staged');
    expect(mock.mock.calls).toStrictEqual([['a', 'b']]);
  });

  it('VALID: {a later test with no setup of its own} => the repo-wide auto-reset cleared history and the staged return value', () => {
    const result = mock();

    expect(result).toBe(undefined);
    expect(mock.mock.calls).toStrictEqual([[]]);
  });
});
