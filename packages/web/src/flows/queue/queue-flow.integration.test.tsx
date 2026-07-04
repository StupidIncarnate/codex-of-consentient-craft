import { QueueFlow } from './queue-flow';

describe('QueueFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports QueueFlow function', () => {
      expect(QueueFlow).toStrictEqual(expect.any(Function));
    });
  });
});
