import { FlowObservableStub, ObservableIdStub } from '@dungeonmaster/shared/contracts';

import {
  LawbringerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from '../../contracts/work-unit/work-unit.stub';
import { workUnitsToFailedObservableIdsTransformer } from './work-units-to-failed-observable-ids-transformer';

describe('workUnitsToFailedObservableIdsTransformer', () => {
  describe('siegemaster work units', () => {
    it('VALID: {single siegemaster work unit with one observable} => returns one observable ID', () => {
      const observableId = ObservableIdStub({ value: 'login-redirects' });
      const workUnit = SiegemasterWorkUnitStub({
        relatedObservables: [FlowObservableStub({ id: observableId })],
      });

      const result = workUnitsToFailedObservableIdsTransformer({ workUnits: [workUnit] });

      expect(result).toStrictEqual(['login-redirects']);
    });

    it('VALID: {two siegemaster work units with different observables} => returns both observable IDs', () => {
      const unit1 = SiegemasterWorkUnitStub({
        relatedObservables: [
          FlowObservableStub({ id: ObservableIdStub({ value: 'login-redirects' }) }),
        ],
      });
      const unit2 = SiegemasterWorkUnitStub({
        relatedObservables: [
          FlowObservableStub({ id: ObservableIdStub({ value: 'shows-user-data' }) }),
        ],
      });

      const result = workUnitsToFailedObservableIdsTransformer({ workUnits: [unit1, unit2] });

      expect(result).toStrictEqual(['login-redirects', 'shows-user-data']);
    });
  });

  describe('non-siegemaster work units', () => {
    it('VALID: {lawbringer work unit} => returns empty array', () => {
      const workUnit = LawbringerWorkUnitStub();

      const result = workUnitsToFailedObservableIdsTransformer({ workUnits: [workUnit] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {spiritmender work unit} => returns empty array', () => {
      const workUnit = SpiritmenderWorkUnitStub();

      const result = workUnitsToFailedObservableIdsTransformer({ workUnits: [workUnit] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('mixed work units', () => {
    it('VALID: {mixed siegemaster and non-siegemaster} => returns only siegemaster observable IDs', () => {
      const siegeUnit = SiegemasterWorkUnitStub({
        relatedObservables: [
          FlowObservableStub({ id: ObservableIdStub({ value: 'login-redirects' }) }),
        ],
      });
      const lawbringerUnit = LawbringerWorkUnitStub();

      const result = workUnitsToFailedObservableIdsTransformer({
        workUnits: [siegeUnit, lawbringerUnit],
      });

      expect(result).toStrictEqual(['login-redirects']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no work units} => returns empty array', () => {
      const result = workUnitsToFailedObservableIdsTransformer({ workUnits: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
