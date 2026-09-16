import { fieldValuesResolveTransformer } from './field-values-resolve-transformer';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';
import { SavedRefStub } from '../../contracts/saved-ref/saved-ref.stub';
import { SavedRecordNameStub } from '../../contracts/saved-record-name/saved-record-name.stub';

describe('fieldValuesResolveTransformer', () => {
  describe('a literal beside a cross-link', () => {
    it('VALID: {values: {title: "x", userRequest: ref}} => returns {title: "x", userRequest: "s1"}', () => {
      const savedName = SavedRecordNameStub({ value: 'origin' });
      const values = FieldValuesStub({
        title: 'x',
        userRequest: SavedRefStub({ name: 'origin', field: 'sessionId' }),
      });

      const result = fieldValuesResolveTransformer({
        values,
        saved: new Map([[savedName, { sessionId: 's1' }]]),
      });

      expect(result).toStrictEqual({ title: 'x', userRequest: 's1' });
    });
  });

  describe('every value a literal', () => {
    it('VALID: {values: {title: "x", status: "created"}} => returns both unchanged', () => {
      const values = FieldValuesStub({ title: 'x', status: 'created' });

      const result = fieldValuesResolveTransformer({ values, saved: new Map() });

      expect(result).toStrictEqual({ title: 'x', status: 'created' });
    });
  });
});
