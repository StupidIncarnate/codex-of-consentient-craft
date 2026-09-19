import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { profileAnswerRenderTransformer } from '../../../transformers/profile-answer-render/profile-answer-render-transformer';

import { SiegelenseProfileResponder } from './siegelense-profile-responder';
import { SiegelenseProfileResponderProxy } from './siegelense-profile-responder.proxy';

describe('SiegelenseProfileResponder', () => {
  describe('the default human summary form', () => {
    it('VALID: {specName: dungeonmaster-stack} => writes the SpecProfile as human summary by default', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-stack',
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
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([profileAnswerRenderTransformer({ profile })]);
    });

    it('VALID: {human: true} => writes the SpecProfile as human summary when human is explicitly true', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-stack',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
      });
      proxy.stageProfile({ profile });

      const result = await SiegelenseProfileResponder({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        human: true,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([profileAnswerRenderTransformer({ profile })]);
    });
  });

  describe('the JSON form', () => {
    it('VALID: {isJson: true} => writes the SpecProfile as one JSON document', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-stack',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
      });
      proxy.stageProfile({ profile });

      const result = await SiegelenseProfileResponder({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        isJson: true,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(profile, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {human: false} => writes the SpecProfile as JSON when human is explicitly false', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-stack',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
      });
      proxy.stageProfile({ profile });

      const result = await SiegelenseProfileResponder({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        human: false,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(profile, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {no samples} => writes the empty profile as human summary rather than refusing', async () => {
      const proxy = SiegelenseProfileResponderProxy();
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-api',
        processes: 1,
        hash: 'a3f9c2e1',
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
      proxy.stageProfile({ profile });

      await SiegelenseProfileResponder({
        specName: SpecNameStub({ value: 'dungeonmaster-api' }),
      });

      expect(proxy.getStdoutWrites()).toStrictEqual([profileAnswerRenderTransformer({ profile })]);
    });
  });
});
