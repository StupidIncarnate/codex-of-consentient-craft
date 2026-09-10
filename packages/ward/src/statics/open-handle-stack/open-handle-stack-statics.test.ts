import { openHandleStackStatics } from './open-handle-stack-statics';

describe('openHandleStackStatics', () => {
  describe('exported shape', () => {
    it('VALID: exported value => matches the full expected object', () => {
      expect(openHandleStackStatics).toStrictEqual({
        frames: {
          maxShown: 3,
          nodeInternal: 'node:',
          dependency: 'node_modules',
        },
        summary: {
          maxGroups: 10,
          keyLines: 2,
        },
      });
    });
  });
});
