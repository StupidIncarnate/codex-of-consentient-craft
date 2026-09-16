import { fromSavedRefTransformer } from './from-saved-ref-transformer';
import { SavedRecordNameStub } from '../../contracts/saved-record-name/saved-record-name.stub';
import { FieldNameStub } from '../../contracts/field-name/field-name.stub';

describe('fromSavedRefTransformer', () => {
  it('VALID: {name: origin, field: sessionId} => returns the saved ref with both keys', () => {
    const result = fromSavedRefTransformer({
      name: SavedRecordNameStub({ value: 'origin' }),
      field: FieldNameStub({ value: 'sessionId' }),
    });

    expect(result).toStrictEqual({ __savedRef: true, name: 'origin', field: 'sessionId' });
  });

  it('VALID: {name: origin} => returns the saved ref with no field key', () => {
    const result = fromSavedRefTransformer({
      name: SavedRecordNameStub({ value: 'origin' }),
    });

    expect(result).toStrictEqual({ __savedRef: true, name: 'origin' });
  });
});
