import type { WsMessageStub } from '@dungeonmaster/shared/contracts';
import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';
import { ProcessIdStub } from '../../../contracts/process-id/process-id.stub';

import { chatSpawnBroker } from './chat-spawn-broker';
import { chatSpawnBrokerProxy } from './chat-spawn-broker.proxy';

type WsClient = ReturnType<typeof WsClientStub>;
type WsMessage = ReturnType<typeof WsMessageStub>;

describe('chatSpawnBroker', () => {
  describe('spawn and stream', () => {
    it('VALID: {args, workingDir} => returns kill handle', () => {
      const proxy = chatSpawnBrokerProxy();
      proxy.setupSpawn();
      const clients = new Set<WsClient>();
      const chatProcessId = ProcessIdStub({ value: 'test-proc-1' });

      const result = chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
      });

      expect(typeof result.kill).toBe('function');
    });

    it('VALID: {line emitted} => broadcasts chat-output to WS clients', () => {
      const proxy = chatSpawnBrokerProxy();
      const { emitLine } = proxy.setupSpawn();
      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const clients = new Set<WsClient>([client]);
      const chatProcessId = ProcessIdStub({ value: 'test-proc-2' });

      chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
      });

      emitLine({ line: '{"type":"assistant"}' });

      expect(sendMock).toHaveBeenCalledTimes(1);

      const sentMessage = JSON.parse(String(sendMock.mock.calls[0][0])) as WsMessage;

      expect(sentMessage.type).toBe('chat-output');
    });

    it('VALID: {exit emitted} => calls onExit callback with exit code', () => {
      const proxy = chatSpawnBrokerProxy();
      const { emitExit } = proxy.setupSpawn();
      const clients = new Set<WsClient>();
      const chatProcessId = ProcessIdStub({ value: 'test-proc-3' });
      const onExit = jest.fn();

      chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
        onExit,
      });

      emitExit({ code: 0 });

      expect(onExit).toHaveBeenCalledTimes(1);
      expect(onExit).toHaveBeenCalledWith({ exitCode: 0, extractedSessionId: null });
    });

    it('VALID: {unparseable line} => still broadcasts to WS clients', () => {
      const proxy = chatSpawnBrokerProxy();
      const { emitLine } = proxy.setupSpawn();
      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const clients = new Set<WsClient>([client]);
      const chatProcessId = ProcessIdStub({ value: 'test-proc-4' });

      chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
      });

      emitLine({ line: 'not-json' });

      expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('VALID: {non-object JSON line} => still broadcasts to WS clients', () => {
      const proxy = chatSpawnBrokerProxy();
      const { emitLine } = proxy.setupSpawn();
      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const clients = new Set<WsClient>([client]);
      const chatProcessId = ProcessIdStub({ value: 'test-proc-5' });

      chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
      });

      emitLine({ line: '"just a string"' });

      expect(sendMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('exit handling', () => {
    it('VALID: {null exit code} => defaults to 1 in onExit callback', () => {
      const proxy = chatSpawnBrokerProxy();
      const { emitExit } = proxy.setupSpawn();
      const clients = new Set<WsClient>();
      const chatProcessId = ProcessIdStub({ value: 'test-proc-6' });
      const onExit = jest.fn();

      chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
        onExit,
      });

      emitExit({ code: null as never });

      expect(onExit).toHaveBeenCalledWith({ exitCode: 1, extractedSessionId: null });
    });

    it('EMPTY: {no onExit callback} => exits without error', () => {
      const proxy = chatSpawnBrokerProxy();
      const { emitExit } = proxy.setupSpawn();
      const clients = new Set<WsClient>();
      const chatProcessId = ProcessIdStub({ value: 'test-proc-7' });

      chatSpawnBroker({
        args: ['-p', 'hello'],
        workingDir: '/project',
        clients,
        chatProcessId,
        logPrefix: 'Test',
      });

      expect(() => {
        emitExit({ code: 0 });
      }).not.toThrow();
    });
  });
});
