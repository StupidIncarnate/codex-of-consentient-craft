import { cwd } from '#gateway/node/process';

import { StartCliContext } from './start-cli-context';

describe('StartCliContext', () => {
  describe('target project root', () => {
    it('VALID: {dungeonmasterRoot} => targetProjectRoot is the directory the process runs in', () => {
      const result = StartCliContext({ dungeonmasterRoot: '/opt/dungeonmaster' });

      expect(result).toStrictEqual({
        dungeonmasterRoot: '/opt/dungeonmaster',
        targetProjectRoot: cwd(),
      });
    });
  });
});
