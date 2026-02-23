import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';

describe('pathJoinAdapter', () => {
  describe('join', () => {
    it('VALID: {two segments} => returns joined path', () => {
      pathJoinAdapterProxy();
      const result = pathJoinAdapter({ segments: ['/home/user', 'subagents'] });

      expect(result).toBe('/home/user/subagents');
    });

    it('VALID: {three segments} => returns joined path', () => {
      pathJoinAdapterProxy();
      const result = pathJoinAdapter({ segments: ['/home', 'user', 'project'] });

      expect(result).toBe('/home/user/project');
    });
  });
});
