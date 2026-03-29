import { ObservableIdStub } from '@dungeonmaster/shared/contracts';

import { siegemasterPhaseResultContract } from './siegemaster-phase-result-contract';
import { SiegemasterPhaseResultStub } from './siegemaster-phase-result.stub';

describe('siegemasterPhaseResultContract', () => {
  describe('valid results', () => {
    it('VALID: {empty failedObservableIds} => parses successfully', () => {
      const result = SiegemasterPhaseResultStub();

      const parsed = siegemasterPhaseResultContract.parse(result);

      expect(parsed).toStrictEqual({ failedObservableIds: [] });
    });

    it('VALID: {with failedObservableIds} => parses successfully', () => {
      const observableId = ObservableIdStub({ value: 'login-redirects' });
      const result = SiegemasterPhaseResultStub({ failedObservableIds: [observableId] });

      const parsed = siegemasterPhaseResultContract.parse(result);

      expect(parsed).toStrictEqual({ failedObservableIds: ['login-redirects'] });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing failedObservableIds} => throws', () => {
      expect(() => {
        siegemasterPhaseResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
