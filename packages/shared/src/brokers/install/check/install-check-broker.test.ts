import { installCheckBroker } from './install-check-broker';
import { installCheckBrokerProxy } from './install-check-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('installCheckBroker', () => {
  describe('valid projects', () => {
    it('VALID: {project with package.json and .claude/} => returns valid', () => {
      const proxy = installCheckBrokerProxy();
      const projectRoot = FilePathStub({ value: '/home/user/project' });

      proxy.setupValid({ projectRoot: '/home/user/project' });

      const result = installCheckBroker({ projectRoot });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('VALID: {different project path} => returns valid', () => {
      const proxy = installCheckBrokerProxy();
      const projectRoot = FilePathStub({ value: '/workspace/my-app' });

      proxy.setupValid({ projectRoot: '/workspace/my-app' });

      const result = installCheckBroker({ projectRoot });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('missing package.json', () => {
    it('INVALID: {no package.json} => returns error', () => {
      const proxy = installCheckBrokerProxy();
      const projectRoot = FilePathStub({ value: '/home/user/project' });

      proxy.setupMissingPackageJson({ projectRoot: '/home/user/project' });

      const result = installCheckBroker({ projectRoot });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No package.json found.');
    });
  });

  describe('missing .claude directory', () => {
    it('INVALID: {no .claude/} => returns error', () => {
      const proxy = installCheckBrokerProxy();
      const projectRoot = FilePathStub({ value: '/home/user/project' });

      proxy.setupMissingClaudeDir({ projectRoot: '/home/user/project' });

      const result = installCheckBroker({ projectRoot });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No .claude directory found.');
    });
  });
});
