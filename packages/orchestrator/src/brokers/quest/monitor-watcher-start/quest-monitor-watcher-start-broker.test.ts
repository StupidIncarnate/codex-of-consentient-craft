import { FilePathStub } from '@dungeonmaster/shared/contracts';

import type { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
import { questMonitorWatcherStartBroker } from './quest-monitor-watcher-start-broker';
import { questMonitorWatcherStartBrokerProxy } from './quest-monitor-watcher-start-broker.proxy';

type IsoTimestamp = ReturnType<typeof IsoTimestampStub>;
type FilePath = ReturnType<typeof FilePathStub>;
type CallEvent = 'clear' | 'register';

const makeMonitorSession = (): {
  isRegistered: () => boolean;
  clear: () => void;
  register: (params: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }) => void;
  get: () => {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  } | null;
  callOrder: () => readonly CallEvent[];
} => {
  let registered: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  } | null = null;
  const order: CallEvent[] = [];

  return {
    isRegistered: (): boolean => registered !== null,
    clear: (): void => {
      registered = null;
      order.push('clear');
    },
    register: ({
      projectDir,
      sessionFilePath,
      registeredAt,
    }: {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    }): void => {
      registered = { projectDir, sessionFilePath, registeredAt };
      order.push('register');
    },
    get: (): {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    } | null => registered,
    callOrder: (): readonly CallEvent[] => order,
  };
};

describe('questMonitorWatcherStartBroker', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir} => registers monitor session and returns handle', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      const monitorSession = makeMonitorSession();

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: '11111111-1111-1111-1111-111111111111',
        projectDir: '/home/user/my-project',
        monitorSession,
        emit: (): void => {
          // no-op — emit recording covered by JSONL watcher tests
        },
      });

      const registered = monitorSession.get();

      expect(registered?.projectDir).toBe(FilePathStub({ value: '/home/user/my-project' }));
      expect(registered?.sessionFilePath).toBe(
        FilePathStub({
          value:
            '/home/user/.claude/projects/-home-user-my-project/11111111-1111-1111-1111-111111111111.jsonl',
        }),
      );

      handle.stop();

      expect(monitorSession.isRegistered()).toBe(false);
    });

    it('VALID: {stop()} => clears monitor session', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      const monitorSession = makeMonitorSession();

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: '22222222-2222-2222-2222-222222222222',
        projectDir: '/home/user/p',
        monitorSession,
        emit: (): void => {
          // no-op for this test
        },
      });

      expect(monitorSession.isRegistered()).toBe(true);

      handle.stop();

      expect(monitorSession.isRegistered()).toBe(false);
    });

    it('VALID: {register sequence} => clear happens before register', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      const monitorSession = makeMonitorSession();

      await questMonitorWatcherStartBroker({
        parentSessionId: '33333333-3333-3333-3333-333333333333',
        projectDir: '/home/user/p',
        monitorSession,
        emit: (): void => {
          // no-op
        },
      });

      expect(monitorSession.callOrder()).toStrictEqual(['clear', 'register']);
    });
  });
});
