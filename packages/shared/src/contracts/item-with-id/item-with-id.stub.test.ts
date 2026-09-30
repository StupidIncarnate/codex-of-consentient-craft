import { ItemWithIdStub } from './item-with-id.stub';

describe('ItemWithIdStub', () => {
  it('VALID: {no args} => uses the default id', () => {
    expect(ItemWithIdStub()).toStrictEqual({ id: 'default-item' });
  });

  it('VALID: {id: "test", _delete: true} => carries both', () => {
    expect(ItemWithIdStub({ id: 'test', _delete: true })).toStrictEqual({
      id: 'test',
      _delete: true,
    });
  });

  it('VALID: {id: "test", extra key} => keeps the extra key', () => {
    expect(ItemWithIdStub({ id: 'test', draftMark: null })).toStrictEqual({
      id: 'test',
      draftMark: null,
    });
  });
});
