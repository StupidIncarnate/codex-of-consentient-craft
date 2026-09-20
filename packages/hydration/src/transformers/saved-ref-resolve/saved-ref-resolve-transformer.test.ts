import { savedRefResolveTransformer } from './saved-ref-resolve-transformer';
import { SavedRefStub } from '../../contracts/saved-ref/saved-ref.stub';
import { SavedRecordNameStub } from '../../contracts/saved-record-name/saved-record-name.stub';

describe('savedRefResolveTransformer', () => {
  describe('a ref naming a field', () => {
    it('VALID: {ref: {name: "origin", field: "sessionId"}, saved: {origin: {sessionId: "s1"}}} => returns "s1"', () => {
      const savedName = SavedRecordNameStub({ value: 'origin' });
      const ref = SavedRefStub({ name: 'origin', field: 'sessionId' });

      const result = savedRefResolveTransformer({
        ref,
        saved: new Map([[savedName, { sessionId: 's1' }]]),
      });

      expect(result).toBe('s1');
    });
  });

  describe('a ref naming no field', () => {
    it('VALID: {ref: {name: "origin"}, saved: {origin: whole record}} => returns the whole record', () => {
      const savedName = SavedRecordNameStub({ value: 'origin' });
      const ref = SavedRefStub({ name: 'origin' });

      const result = savedRefResolveTransformer({
        ref,
        saved: new Map([[savedName, { sessionId: 's1', url: 'http://localhost:3737' }]]),
      });

      expect(result).toStrictEqual({ sessionId: 's1', url: 'http://localhost:3737' });
    });
  });

  describe('a ref naming a record not present in saved', () => {
    it('EMPTY: {ref: {name: "missing", field: "x"}, saved: {}} => returns undefined', () => {
      const ref = SavedRefStub({ name: 'missing', field: 'x' });

      const result = savedRefResolveTransformer({ ref, saved: new Map() });

      expect(result).toBe(undefined);
    });
  });
});
