import { processCwdAdapter } from './process-cwd-adapter';
import { processCwdAdapterProxy } from './process-cwd-adapter.proxy';

describe('processCwdAdapter', () => {
  describe('valid cwd', () => {
    it('VALID: {cwd: "/home/user/project"} => returns branded FilePath', () => {
      const proxy = processCwdAdapterProxy();

      proxy.returns({ path: '/home/user/project' });

      const result = processCwdAdapter();

      expect(result).toBe('/home/user/project');
    });
  });
});
