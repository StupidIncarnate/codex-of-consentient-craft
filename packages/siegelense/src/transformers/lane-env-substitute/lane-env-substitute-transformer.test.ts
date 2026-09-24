import { laneEnvSubstituteTransformer } from './lane-env-substitute-transformer';
import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';
import { LaneSpecStub } from '../../contracts/lane-spec/lane-spec.stub';

const PORTS = PortPairStub({ api: 34_172, web: 34_173 });
const HOME = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' });
const CLAUDE_QUEUE_DIR = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/claude-queue' });
const WARD_QUEUE_DIR = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/ward-queue' });
const API_WORKSPACE = ContentTextStub({ value: '@dungeonmaster/server' });
const WEB_WORKSPACE = ContentTextStub({ value: '@dungeonmaster/web' });
const REPO_ROOT = AbsoluteFilePathStub({ value: '/repo' });

describe('laneEnvSubstituteTransformer', () => {
  describe('a record with a workspace-name placeholder', () => {
    it('VALID: {env with {apiWorkspace}/{webWorkspace}} => substitutes each, keeping the keys', () => {
      const { env } = LaneSpecStub({
        env: {
          API_PKG_NAME: '{apiWorkspace}',
          WEB_PKG_NAME: '{webWorkspace}',
        },
      });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
      });

      expect(result).toStrictEqual({
        API_PKG_NAME: '@dungeonmaster/server',
        WEB_PKG_NAME: '@dungeonmaster/web',
      });
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
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
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
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
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
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('D4: a relative path value resolves against the repo root', () => {
    it('VALID: {env with a bare relative path} => prefixes it with repoRoot', () => {
      const { env } = LaneSpecStub({
        env: { CLAUDE_CLI_PATH: 'packages/web/test/harnesses/claude-mock/bin/claude' },
      });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
      });

      expect(result).toStrictEqual({
        CLAUDE_CLI_PATH: '/repo/packages/web/test/harnesses/claude-mock/bin/claude',
      });
    });

    it('VALID: {env with an already-absolute path} => is left untouched, never double-prefixed', () => {
      const { env } = LaneSpecStub({ env: { DUNGEONMASTER_HOME: '{home}' } });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
      });

      expect(result).toStrictEqual({ DUNGEONMASTER_HOME: '/tmp/dm-siege-inst_1' });
    });

    it('VALID: {env with a resolved {apiWorkspace} token} => the scoped package name is left untouched', () => {
      const { env } = LaneSpecStub({ env: { TARGET_WORKSPACE: '{apiWorkspace}' } });

      const result = laneEnvSubstituteTransformer({
        env,
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
        repoRoot: REPO_ROOT,
      });

      expect(result).toStrictEqual({ TARGET_WORKSPACE: '@dungeonmaster/server' });
    });
  });
});
