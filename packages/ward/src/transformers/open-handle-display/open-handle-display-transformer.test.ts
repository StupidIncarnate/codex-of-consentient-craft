import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { openHandleDisplayTransformer } from './open-handle-display-transformer';
import { OpenHandleStub } from '../../contracts/open-handle/open-handle.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';

const CWD = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_NAME = ProjectFolderStub({ name: 'orchestrator', path: '/repo/packages/o' }).name;

describe('openHandleDisplayTransformer', () => {
  describe('what it renders', () => {
    it('VALID: {one own frame} => package, message and that frame', () => {
      const handle = OpenHandleStub({
        name: 'setInterval',
        message: 'setInterval still armed when src/poll.test.ts finished',
        stack: 'at pollBroker (/repo/packages/o/src/poll-broker.ts:12:3)',
      });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe(
        '  orchestrator  setInterval still armed when src/poll.test.ts finished\n' +
          '      at pollBroker (packages/o/src/poll-broker.ts:12:3)',
      );
    });

    it('VALID: {the repo prefix in the message} => strips it there too', () => {
      const handle = OpenHandleStub({
        name: 'setInterval',
        message: 'setInterval still armed when /repo/packages/o/src/poll.test.ts finished',
        stack: 'at pollBroker (/repo/packages/o/src/poll-broker.ts:12:3)',
      });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe(
        '  orchestrator  setInterval still armed when packages/o/src/poll.test.ts finished\n' +
          '      at pollBroker (packages/o/src/poll-broker.ts:12:3)',
      );
    });
  });

  describe('which frames it keeps', () => {
    it('VALID: {node internals and dependency frames around own code} => keeps only own code', () => {
      const handle = OpenHandleStub({
        name: 'PIPEWRAP',
        message: 'PIPEWRAP',
        stack: [
          'at listOnTimeout (node:internal/timers:594:17)',
          'at run (/repo/node_modules/jest-circus/build/run.js:1:1)',
          'at pollBroker (/repo/packages/o/src/poll-broker.ts:12:3)',
        ].join('\n'),
      });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe(
        '  orchestrator  PIPEWRAP\n      at pollBroker (packages/o/src/poll-broker.ts:12:3)',
      );
    });

    it('EDGE: {four own frames} => keeps the first three', () => {
      const handle = OpenHandleStub({
        name: 'setImmediate',
        message: 'setImmediate',
        stack: [
          'at a (/repo/a.ts:1:1)',
          'at b (/repo/b.ts:2:2)',
          'at c (/repo/c.ts:3:3)',
          'at d (/repo/d.ts:4:4)',
        ].join('\n'),
      });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe(
        '  orchestrator  setImmediate\n      at a (a.ts:1:1)\n      at b (b.ts:2:2)\n      at c (c.ts:3:3)',
      );
    });

    it('EDGE: {every frame inside a dependency} => falls back to the first raw frame', () => {
      const handle = OpenHandleStub({
        name: 'TCPWRAP',
        message: 'TCPWRAP',
        stack: [
          'at connect (/repo/node_modules/undici/lib/core.js:9:9)',
          'at request (/repo/node_modules/undici/lib/api.js:4:4)',
        ].join('\n'),
      });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe(
        '  orchestrator  TCPWRAP\n      at connect (node_modules/undici/lib/core.js:9:9)',
      );
    });

    it('EDGE: {lines that are not frames} => drops them', () => {
      const handle = OpenHandleStub({
        name: 'setInterval',
        message: 'setInterval',
        stack: 'Error: setInterval\n    at pollBroker (/repo/a.ts:1:1)\n  some trailing note',
      });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe('  orchestrator  setInterval\n      at pollBroker (a.ts:1:1)');
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {stack: ""} => renders the message with no frames', () => {
      const handle = OpenHandleStub({ name: 'setInterval', message: 'setInterval', stack: '' });

      const result = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(result).toBe('  orchestrator  setInterval');
    });
  });

  describe('two reports of one leak', () => {
    it('VALID: {same package, message and frames} => renders identically, so they group', () => {
      const handle = OpenHandleStub({
        name: 'setImmediate',
        message: 'setImmediate still armed when /repo/a.test.ts finished',
        stack: 'at createMock (/repo/a.proxy.ts:98:7)',
      });

      const first = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });
      const second = openHandleDisplayTransformer({ packageName: PACKAGE_NAME, handle, cwd: CWD });

      expect(first).toBe(String(second));
    });
  });
});
