import { pid } from '#gateway/node/process';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';

import { driverLiveCheckBroker } from './driver-live-check-broker';
import { driverLiveCheckBrokerProxy } from './driver-live-check-broker.proxy';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';

const DIFFERENT_PID = ProcessIdStub({ value: String(pid + 1) });
const SOCKET_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_live0001.sock' });

describe('driverLiveCheckBroker', () => {
  describe('the row has never booted', () => {
    it('EMPTY: {entry.pid: null} => returns false', async () => {
      driverLiveCheckBrokerProxy();
      const entry = RegistryEntryStub({ pid: null, socketPath: null });

      const result = await driverLiveCheckBroker({ entry });

      expect(result).toBe(false);
    });
  });

  describe('the row already names this same process', () => {
    it("VALID: {entry.pid: this process's own pid} => returns false", async () => {
      driverLiveCheckBrokerProxy();
      const selfPid = ProcessIdStub({ value: String(pid) });
      const entry = RegistryEntryStub({ pid: selfPid, socketPath: SOCKET_PATH });

      const result = await driverLiveCheckBroker({ entry });

      expect(result).toBe(false);
    });
  });

  describe('a different pid still answers process.kill(pid, 0)', () => {
    it('VALID: {entry.pid: a live different pid} => returns true without ever pinging the socket', async () => {
      const proxy = driverLiveCheckBrokerProxy();
      const entry = RegistryEntryStub({ pid: DIFFERENT_PID, socketPath: SOCKET_PATH });
      proxy.setupPidAlive({ pgid: ProcessGroupIdStub({ value: Number(DIFFERENT_PID) }) });

      const result = await driverLiveCheckBroker({ entry });

      expect(result).toBe(true);
    });
  });

  describe('a different pid is gone but the socket still answers', () => {
    it('VALID: {entry.pid: gone, socket answers ping} => returns true', async () => {
      const proxy = driverLiveCheckBrokerProxy();
      const entry = RegistryEntryStub({ pid: DIFFERENT_PID, socketPath: SOCKET_PATH });
      proxy.setupPidDead({ pgid: ProcessGroupIdStub({ value: Number(DIFFERENT_PID) }) });
      proxy.setupSocketAnswers({ socketPath: SOCKET_PATH });

      const result = await driverLiveCheckBroker({ entry });

      expect(result).toBe(true);
    });
  });

  describe('a different pid is gone and there is no socket to ask', () => {
    it('VALID: {entry.pid: gone, socketPath: null} => returns false', async () => {
      const proxy = driverLiveCheckBrokerProxy();
      const entry = RegistryEntryStub({ pid: DIFFERENT_PID, socketPath: null });
      proxy.setupPidDead({ pgid: ProcessGroupIdStub({ value: Number(DIFFERENT_PID) }) });

      const result = await driverLiveCheckBroker({ entry });

      expect(result).toBe(false);
    });
  });

  describe('a different pid is gone and the socket refuses the connection', () => {
    it('VALID: {entry.pid: gone, socket unreachable} => returns false', async () => {
      const proxy = driverLiveCheckBrokerProxy();
      const entry = RegistryEntryStub({ pid: DIFFERENT_PID, socketPath: SOCKET_PATH });
      proxy.setupPidDead({ pgid: ProcessGroupIdStub({ value: Number(DIFFERENT_PID) }) });
      proxy.setupSocketUnreachable({ socketPath: SOCKET_PATH });

      const result = await driverLiveCheckBroker({ entry });

      expect(result).toBe(false);
    });
  });
});
