import { readItem } from '../read-item/read-item';
import { writeItem } from './write-item';
import { writeItemProxy } from './write-item.proxy';

describe('writeItem', () => {
  it('VALID: {key, value} => writes the value and returns { success: true }', () => {
    const result = writeItem({ key: 'write-item-valid', value: 'stored-value' });

    expect(result).toStrictEqual({ success: true });
    expect(readItem({ key: 'write-item-valid' })).toBe('stored-value');
  });

  it('ERROR: {quota exceeded} => returns { success: false, error } carrying the real error rather than throwing', () => {
    const proxy = writeItemProxy();
    const quotaError = Object.assign(new Error('quota exceeded'), { name: 'QuotaExceededError' });
    proxy.setupWriteFails({ key: 'write-item-quota', error: quotaError });

    const result = writeItem({ key: 'write-item-quota', value: 'x' });

    expect(result).toStrictEqual({ success: false, error: quotaError });
  });

  it('ERROR: {storage disabled for writes} => returns { success: false, error } carrying the real error rather than throwing', () => {
    const proxy = writeItemProxy();
    const securityError = Object.assign(new Error('access denied'), { name: 'SecurityError' });
    proxy.setupWriteFails({ key: 'write-item-blocked', error: securityError });

    const result = writeItem({ key: 'write-item-blocked', value: 'x' });

    expect(result).toStrictEqual({ success: false, error: securityError });
  });

  describe('tolerant addressing', () => {
    it('ERROR: {throwsMatchingKey, a predicate} => returns { success: false, error } for a key the predicate accepts', () => {
      const proxy = writeItemProxy();
      const quotaError = Object.assign(new Error('quota exceeded'), {
        name: 'QuotaExceededError',
      });
      proxy.throwsMatchingKey({
        key: (value) => String(value).startsWith('write-item-computed-'),
        error: quotaError,
      });

      const result = writeItem({ key: 'write-item-computed-at-runtime', value: 'x' });

      expect(result).toStrictEqual({ success: false, error: quotaError });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the written value', () => {
      const proxy = writeItemProxy();

      writeItem({ key: 'write-item-inspected', value: 'computed-at-runtime' });

      expect(proxy.getCallsFor({ key: 'write-item-inspected' })).toStrictEqual([
        ['write-item-inspected', 'computed-at-runtime'],
      ]);
    });
  });
});
