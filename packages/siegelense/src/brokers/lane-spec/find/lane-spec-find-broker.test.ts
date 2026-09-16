import { laneSpecFindBroker } from './lane-spec-find-broker';
import { laneSpecFindBrokerProxy } from './lane-spec-find-broker.proxy';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

describe('laneSpecFindBroker', () => {
  describe('a known spec', () => {
    it('VALID: {specName: "dungeonmaster-web"} => returns the validated spec with a browser', () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-web' });

      const result = laneSpecFindBroker({ specName });

      expect(result.browser).toBe(true);
    });

    it('VALID: {specName: "dungeonmaster-headless"} => returns the validated browserless spec', () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-headless' });

      const result = laneSpecFindBroker({ specName });

      expect(result.browser).toBe(false);
    });
  });

  describe('an unknown spec', () => {
    it('ERROR: {specName: "dungeonmaster-nightly"} => throws naming the spec and the known names', () => {
      laneSpecFindBrokerProxy();
      const specName = SpecNameStub({ value: 'dungeonmaster-nightly' });

      expect(() => laneSpecFindBroker({ specName })).toThrow(
        /Unknown lane spec "dungeonmaster-nightly"\. Known specs: dungeonmaster-web, dungeonmaster-headless/u,
      );
    });
  });
});
