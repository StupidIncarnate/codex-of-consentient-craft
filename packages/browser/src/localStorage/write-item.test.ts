import { readItem } from './read-item';
import { writeItem } from './write-item';
import { writeItemProxy } from './write-item.proxy';

describe('writeItem', () => {
  it('VALID: {key, value} => writes the value and returns { success: true }', () => {
    const result = writeItem({ key: 'write-item-valid', value: 'stored-value' });

    expect(result).toStrictEqual({ success: true });
    expect(readItem({ key: 'write-item-valid' })).toBe('stored-value');
  });

  it('ERROR: {quota exceeded} => returns { success: false } rather than throwing', () => {
    const proxy = writeItemProxy();
    proxy.setupWriteFails({
      key: 'write-item-quota',
      value: 'x',
      error: Object.assign(new Error('quota exceeded'), { name: 'QuotaExceededError' }),
    });

    const result = writeItem({ key: 'write-item-quota', value: 'x' });

    expect(result).toStrictEqual({ success: false });
  });

  it('ERROR: {storage disabled for writes} => returns { success: false } rather than throwing', () => {
    const proxy = writeItemProxy();
    proxy.setupWriteFails({
      key: 'write-item-blocked',
      value: 'x',
      error: Object.assign(new Error('access denied'), { name: 'SecurityError' }),
    });

    const result = writeItem({ key: 'write-item-blocked', value: 'x' });

    expect(result).toStrictEqual({ success: false });
  });
});
