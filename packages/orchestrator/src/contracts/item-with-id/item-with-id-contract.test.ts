import { itemWithIdContract as _itemWithIdContract } from './item-with-id-contract';
import { ItemWithIdStub } from './item-with-id.stub';

describe('itemWithIdContract', () => {
  describe('valid items', () => {
    it('VALID: {id: "test"} => parses successfully', () => {
      const result = ItemWithIdStub({ id: 'test' });

      expect(result.id).toBe('test');
    });

    it('VALID: {id: "test", _delete: true} => parses with delete flag', () => {
      const result = ItemWithIdStub({ id: 'test', _delete: true });

      expect(result.id).toBe('test');
      expect(result._delete).toBe(true);
    });

    it('VALID: {id: "test", extra: "field"} => passes through extra properties', () => {
      const result = ItemWithIdStub({ id: 'test', name: 'extra' });

      expect(result.id).toBe('test');
      expect(result.name).toBe('extra');
    });
  });

  describe('defaults', () => {
    it('VALID: {no args} => uses default id', () => {
      const result = ItemWithIdStub();

      expect(result.id).toBe('default-item');
    });
  });
});
