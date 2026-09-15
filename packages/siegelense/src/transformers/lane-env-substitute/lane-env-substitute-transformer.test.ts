import { laneEnvSubstituteTransformer } from './lane-env-substitute-transformer';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';
import { LaneSpecStub } from '../../contracts/lane-spec/lane-spec.stub';

describe('laneEnvSubstituteTransformer', () => {
  describe('a record with placeholders', () => {
    it('VALID: {env with {apiPort} and {webPort}} => substitutes both, keeping the keys', () => {
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const { env } = LaneSpecStub({
        env: { DUNGEONMASTER_PORT: '{apiPort}', DUNGEONMASTER_WEB_PORT: '{webPort}' },
      });

      const result = laneEnvSubstituteTransformer({ env, ports });

      expect(result).toStrictEqual({
        DUNGEONMASTER_PORT: '34172',
        DUNGEONMASTER_WEB_PORT: '34173',
      });
    });
  });

  describe('a record with no placeholder', () => {
    it('VALID: {env with a literal value} => leaves it untouched', () => {
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const { env } = LaneSpecStub({ env: { E2E_SIGNAL_BACK_HTTP: '1' } });

      const result = laneEnvSubstituteTransformer({ env, ports });

      expect(result).toStrictEqual({ E2E_SIGNAL_BACK_HTTP: '1' });
    });
  });

  describe('an empty record', () => {
    it('EMPTY: {env: {}} => returns an empty record', () => {
      const ports = PortPairStub({ api: 34_172, web: 34_173 });
      const { env } = LaneSpecStub({ env: {} });

      const result = laneEnvSubstituteTransformer({ env, ports });

      expect(result).toStrictEqual({});
    });
  });
});
