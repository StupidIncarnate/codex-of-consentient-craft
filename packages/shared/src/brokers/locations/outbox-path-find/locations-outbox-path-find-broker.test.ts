import { locationsOutboxPathFindBroker } from './locations-outbox-path-find-broker';
import { locationsOutboxPathFindBrokerProxy } from './locations-outbox-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsOutboxPathFindBroker', () => {
  describe('outbox path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/event-outbox.jsonl', () => {
      const proxy = locationsOutboxPathFindBrokerProxy();

      proxy.setupOutboxPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        outboxPath: FilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      });

      const result = locationsOutboxPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/event-outbox.jsonl' }),
      );
    });
  });
});
