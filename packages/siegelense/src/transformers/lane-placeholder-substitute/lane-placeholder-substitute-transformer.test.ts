import { lanePlaceholderSubstituteTransformer } from './lane-placeholder-substitute-transformer';
import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';

const PORTS = PortPairStub({ api: 34_172, web: 34_173 });
const HOME = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' });
const CLAUDE_QUEUE_DIR = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/claude-queue' });
const WARD_QUEUE_DIR = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/ward-queue' });
const API_WORKSPACE = ContentTextStub({ value: '@dungeonmaster/server' });
const WEB_WORKSPACE = ContentTextStub({ value: '@dungeonmaster/web' });

describe('lanePlaceholderSubstituteTransformer', () => {
  describe('a port placeholder', () => {
    it('VALID: {template: "{apiPort}"} => returns the api port as a string', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{apiPort}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('34172');
    });

    it('VALID: {template: "{webPort}"} => returns the web port as a string', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{webPort}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('34173');
    });
  });

  describe('an instance-path placeholder', () => {
    it('VALID: {template: "{home}"} => returns the instance throwaway home', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{home}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('/tmp/dm-siege-inst_1');
    });

    it('VALID: {template: "{claudeQueueDir}"} => returns the instance claude queue dir', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{claudeQueueDir}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('/tmp/dm-siege-inst_1/claude-queue');
    });

    it('VALID: {template: "{wardQueueDir}"} => returns the instance ward queue dir', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{wardQueueDir}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('/tmp/dm-siege-inst_1/ward-queue');
    });
  });

  describe('a workspace-name placeholder', () => {
    it('VALID: {template: "{apiWorkspace}"} => returns the resolved backend package name', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{apiWorkspace}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('@dungeonmaster/server');
    });

    it('VALID: {template: "{webWorkspace}"} => returns the resolved frontend package name', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{webWorkspace}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('@dungeonmaster/web');
    });

    it('VALID: {template: "--workspace={apiWorkspace}"} => substitutes in place', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '--workspace={apiWorkspace}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('--workspace=@dungeonmaster/server');
    });
  });

  describe('placeholders inside a larger string', () => {
    it('VALID: {template: "http://host:{apiPort}/api/guilds"} => substitutes in place', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: 'http://host:{apiPort}/api/guilds',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('http://host:34172/api/guilds');
    });

    it('VALID: {template: both ports} => substitutes each independently', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: 'api={apiPort} web={webPort}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('api=34172 web=34173');
    });

    it('VALID: {template: repeated placeholder} => substitutes every occurrence', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{apiPort}-{apiPort}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('34172-34172');
    });

    it('VALID: {template: every known token} => substitutes all seven independently', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template:
          '{apiPort}|{webPort}|{home}|{claudeQueueDir}|{wardQueueDir}|{apiWorkspace}|{webWorkspace}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe(
        '34172|34173|/tmp/dm-siege-inst_1|/tmp/dm-siege-inst_1/claude-queue|/tmp/dm-siege-inst_1/ward-queue' +
          '|@dungeonmaster/server|@dungeonmaster/web',
      );
    });
  });

  describe('a template carrying a placeholder this design does not resolve', () => {
    it('EDGE: {template: "{fakeClaudeCliPath}"} => passes the unknown placeholder through untouched', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{fakeClaudeCliPath}',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('{fakeClaudeCliPath}');
    });
  });

  describe('a template with no placeholder', () => {
    it('EMPTY: {template: "api-server.log"} => returns it unchanged', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: 'api-server.log',
        ports: PORTS,
        home: HOME,
        claudeQueueDir: CLAUDE_QUEUE_DIR,
        wardQueueDir: WARD_QUEUE_DIR,
        apiWorkspace: API_WORKSPACE,
        webWorkspace: WEB_WORKSPACE,
      });

      expect(result).toBe('api-server.log');
    });
  });
});
