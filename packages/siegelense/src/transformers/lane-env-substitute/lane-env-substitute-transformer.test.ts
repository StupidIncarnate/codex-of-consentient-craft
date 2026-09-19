import { laneEnvSubstituteTransformer } from './lane-env-substitute-transformer';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';
import { LaneSpecStub } from '../../contracts/lane-spec/lane-spec.stub';
import { laneSpecStatics } from '../../statics/lane-spec/lane-spec-statics';

const PORTS = PortPairStub({ api: 34_172, web: 34_173 });
const HOME = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' });
const CLAUDE_QUEUE_DIR = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/claude-queue' });
const WARD_QUEUE_DIR = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/ward-queue' });

describe('laneEnvSubstituteTransformer', () => {
  describe('the built-in specs, run through the real substitution', () => {
    it('VALID: {dungeonmaster-stack} => every declared env value resolves, no placeholder left', () => {
      // Statics hold raw, unbranded data (see lane-spec-statics.ts's PURPOSE) — routing it through
      // LaneSpecStub's own laneSpecContract.parse is what brands it, without this test file
      // importing a contract directly.
      const spec = LaneSpecStub({ ...laneSpecStatics.specs['dungeonmaster-stack'] });

      const substitutedValues = [
        laneEnvSubstituteTransformer({
          env: spec.env,
          ports: PORTS,
          home: HOME,
          claudeQueueDir: CLAUDE_QUEUE_DIR,
          wardQueueDir: WARD_QUEUE_DIR,
        }),
        ...spec.processes.map((process) =>
          laneEnvSubstituteTransformer({
            env: process.env,
            ports: PORTS,
            home: HOME,
            claudeQueueDir: CLAUDE_QUEUE_DIR,
            wardQueueDir: WARD_QUEUE_DIR,
          }),
        ),
      ].flatMap((record) => Object.values(record));
      const hasUnresolvedPlaceholder = substitutedValues.some((value) => value.includes('{'));

      expect(hasUnresolvedPlaceholder).toBe(false);
    });

    it('VALID: {dungeonmaster-api} => every declared env value resolves, no placeholder left', () => {
      const spec = LaneSpecStub({ ...laneSpecStatics.specs['dungeonmaster-api'] });

      const substitutedValues = [
        laneEnvSubstituteTransformer({
          env: spec.env,
          ports: PORTS,
          home: HOME,
          claudeQueueDir: CLAUDE_QUEUE_DIR,
          wardQueueDir: WARD_QUEUE_DIR,
        }),
        ...spec.processes.map((process) =>
          laneEnvSubstituteTransformer({
            env: process.env,
            ports: PORTS,
            home: HOME,
            claudeQueueDir: CLAUDE_QUEUE_DIR,
            wardQueueDir: WARD_QUEUE_DIR,
          }),
        ),
      ].flatMap((record) => Object.values(record));
      const hasUnresolvedPlaceholder = substitutedValues.some((value) => value.includes('{'));

      expect(hasUnresolvedPlaceholder).toBe(false);
    });
  });

  describe('a record with placeholders', () => {
    it('VALID: {env with every token} => substitutes each, keeping the keys', () => {
      const { env } = LaneSpecStub({
        env: {
          DUNGEONMASTER_PORT: '{apiPort}',
          DUNGEONMASTER_WEB_PORT: '{webPort}',
          DUNGEONMASTER_HOME: '{home}',
          FAKE_CLAUDE_QUEUE_DIR: '{claudeQueueDir}',
          FAKE_WARD_QUEUE_DIR: '{wardQueueDir}',
        },
      });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
      });

      expect(result).toStrictEqual({
        DUNGEONMASTER_PORT: '34172',
        DUNGEONMASTER_WEB_PORT: '34173',
        DUNGEONMASTER_HOME: '/tmp/dm-siege-inst_1',
        FAKE_CLAUDE_QUEUE_DIR: '/tmp/dm-siege-inst_1/claude-queue',
        FAKE_WARD_QUEUE_DIR: '/tmp/dm-siege-inst_1/ward-queue',
      });
    });
  });

  describe('a record with no placeholder', () => {
    it('VALID: {env with a literal value} => leaves it untouched', () => {
      const { env } = LaneSpecStub({ env: { E2E_SIGNAL_BACK_HTTP: '1' } });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
      });

      expect(result).toStrictEqual({ E2E_SIGNAL_BACK_HTTP: '1' });
    });
  });

  describe('an empty record', () => {
    it('EMPTY: {env: {}} => returns an empty record', () => {
      const { env } = LaneSpecStub({ env: {} });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
      });

      expect(result).toStrictEqual({});
    });
  });
});
