import { ProjectPathStub } from '@dungeonmaster/shared/contracts';

import { parentPathTransformer } from './parent-path-transformer';

describe('parentPathTransformer', () => {
  describe('nested paths', () => {
    it('VALID: {path: "/home/user/projects"} => returns "/home/user"', () => {
      const path = ProjectPathStub({ value: '/home/user/projects' });

      const result = parentPathTransformer({ path });

      expect(result).toBe('/home/user');
    });

    it('VALID: {path: "/home/user"} => returns "/home"', () => {
      const path = ProjectPathStub({ value: '/home/user' });

      const result = parentPathTransformer({ path });

      expect(result).toBe('/home');
    });
  });

  describe('root-adjacent paths', () => {
    it('EDGE: {path: "/home"} => returns "/"', () => {
      const path = ProjectPathStub({ value: '/home' });

      const result = parentPathTransformer({ path });

      expect(result).toBe('/');
    });
  });

  describe('trailing slash', () => {
    it('EDGE: {path: "/home/user/"} => returns "/home"', () => {
      const path = ProjectPathStub({ value: '/home/user/' });

      const result = parentPathTransformer({ path });

      expect(result).toBe('/home');
    });
  });
});
