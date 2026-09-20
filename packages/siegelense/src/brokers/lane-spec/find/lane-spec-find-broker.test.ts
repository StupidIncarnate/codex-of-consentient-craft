import { laneSpecFindBroker } from './lane-spec-find-broker';
import { laneSpecFindBrokerProxy } from './lane-spec-find-broker.proxy';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

describe('laneSpecFindBroker', () => {
  describe('a known spec', () => {
    it('VALID: {specName: "dungeonmaster-stack"} => returns the validated spec with a browser', () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-stack' });

      const result = laneSpecFindBroker({ specName });

      expect(result.browser).toBe(true);
    });

    it('VALID: {specName: "dungeonmaster-api"} => returns the validated browserless spec', () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-api' });

      const result = laneSpecFindBroker({ specName });

      expect(result.browser).toBe(false);
    });
  });

  describe('an unknown spec', () => {
    it('ERROR: {specName: "dungeonmaster-nightly"} => throws naming the spec and the known names', () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-nightly' });

      expect(() => laneSpecFindBroker({ specName })).toThrow(
        /Unknown lane spec "dungeonmaster-nightly"\. Known specs: dungeonmaster-stack, dungeonmaster-api/u,
      );
    });
  });
});
