import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { SiegelenseProfileResponder } from './siegelense-profile-responder';
import { SiegelenseProfileResponderProxy } from './siegelense-profile-responder.proxy';

describe('SiegelenseProfileResponder', () => {
  describe('a measured profile', () => {
    it('VALID: {specName: dungeonmaster-web} => writes the SpecProfile as one JSON document, both pool groups intact', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-web',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });
      proxy.stageProfile({ profile });

      const result = await SiegelenseProfileResponder({
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(profile, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {no samples} => writes the empty profile rather than refusing', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-headless',
        processes: 1,
        hash: 'a3f9c2e1',
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
      proxy.stageProfile({ profile });

      await SiegelenseProfileResponder({
        specName: SpecNameStub({ value: 'dungeonmaster-headless' }),
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(profile, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });
});
