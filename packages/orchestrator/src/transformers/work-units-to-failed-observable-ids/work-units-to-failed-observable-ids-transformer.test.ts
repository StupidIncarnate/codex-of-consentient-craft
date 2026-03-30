import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

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
      const observable = FlowObservableStub({ id: observableId });
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const workUnit = SiegemasterWorkUnitStub({ flow });

      const result = workUnitsToFailedObservableIdsTransformer({ workUnits: [workUnit] });

      expect(result).toStrictEqual(['login-redirects']);
    });

    it('VALID: {two siegemaster work units with different observables} => returns both observable IDs', () => {
      const node1 = FlowNodeStub({
        observables: [FlowObservableStub({ id: ObservableIdStub({ value: 'login-redirects' }) })],
      });
      const node2 = FlowNodeStub({
        observables: [FlowObservableStub({ id: ObservableIdStub({ value: 'shows-user-data' }) })],
      });
      const unit1 = SiegemasterWorkUnitStub({ flow: FlowStub({ nodes: [node1] }) });
      const unit2 = SiegemasterWorkUnitStub({ flow: FlowStub({ nodes: [node2] }) });

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
      const node = FlowNodeStub({
        observables: [FlowObservableStub({ id: ObservableIdStub({ value: 'login-redirects' }) })],
      });
      const siegeUnit = SiegemasterWorkUnitStub({ flow: FlowStub({ nodes: [node] }) });
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
