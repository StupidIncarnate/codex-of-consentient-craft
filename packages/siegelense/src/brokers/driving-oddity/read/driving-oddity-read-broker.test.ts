import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { DrivingOddityStub } from '../../../contracts/driving-oddity/driving-oddity.stub';
import type { DrivingOddityFileMalformedError } from '../../../errors/driving-oddity-file-malformed/driving-oddity-file-malformed-error';

import { drivingOddityReadBroker } from './driving-oddity-read-broker';
import { drivingOddityReadBrokerProxy } from './driving-oddity-read-broker.proxy';

const FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
});

describe('drivingOddityReadBroker', () => {
  describe('a file that does not exist', () => {
    it('EMPTY: {no file} => returns an empty list rather than throwing', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupNoFile({ filePath: FILE_PATH });

      const result = await drivingOddityReadBroker({ filePath: FILE_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a file holding entries', () => {
    it('VALID: {two lines} => returns both entries in append order', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupFile({
        filePath: FILE_PATH,
        entries: [
          DrivingOddityStub({
            key: 'GUILD_ADD_MODAL',
            line: 'Click the wrapper, not the label.',
            kind: 'quirk',
          }),
          DrivingOddityStub({
            key: 'PIXEL_BTN',
            line: 'This appears twice under GUILD_SESSION_LIST.',
            kind: 'defect',
          }),
        ],
      });

      const result = await drivingOddityReadBroker({ filePath: FILE_PATH });

      expect(result).toStrictEqual([
        { key: 'GUILD_ADD_MODAL', line: 'Click the wrapper, not the label.', kind: 'quirk' },
        { key: 'PIXEL_BTN', line: 'This appears twice under GUILD_SESSION_LIST.', kind: 'defect' },
      ]);
    });

    it('EDGE: {a trailing blank line} => is skipped rather than parsed as an entry', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupRawFile({
        filePath: FILE_PATH,
        contents: '{"key":"GUILD_ADD_MODAL","line":"Click the wrapper.","kind":"quirk"}\n\n',
      });

      const result = await drivingOddityReadBroker({ filePath: FILE_PATH });

      expect(result).toStrictEqual([
        { key: 'GUILD_ADD_MODAL', line: 'Click the wrapper.', kind: 'quirk' },
      ]);
    });

    it('EMPTY: {a file with no lines} => returns an empty list', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupRawFile({ filePath: FILE_PATH, contents: '' });

      const result = await drivingOddityReadBroker({ filePath: FILE_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a file that exists but cannot be parsed', () => {
    it('ERROR: {invalid JSON on line 1} => throws naming the file, the 1-based line number and the raw line text', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupRawFile({ filePath: FILE_PATH, contents: '{"key":"GUILD_ADD_MODAL",\n' });

      const error = await drivingOddityReadBroker({ filePath: FILE_PATH }).then(
        (): never => {
          throw new Error('Expected drivingOddityReadBroker to reject');
        },
        (caught: unknown): DrivingOddityFileMalformedError =>
          caught as DrivingOddityFileMalformedError,
      );

      expect({
        name: error.name,
        filePath: error.filePath,
        lineNumber: error.lineNumber,
        line: error.line,
      }).toStrictEqual({
        name: 'DrivingOddityFileMalformedError',
        filePath: FILE_PATH,
        lineNumber: 1,
        line: '{"key":"GUILD_ADD_MODAL",',
      });
    });

    it('ERROR: {a well-formed second line following a malformed first} => names line 1, not line 2', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupRawFile({
        filePath: FILE_PATH,
        contents:
          '{"key":"BAD",\n{"key":"GUILD_ADD_MODAL","line":"Click the wrapper.","kind":"quirk"}\n',
      });

      const error = await drivingOddityReadBroker({ filePath: FILE_PATH }).then(
        (): never => {
          throw new Error('Expected drivingOddityReadBroker to reject');
        },
        (caught: unknown): DrivingOddityFileMalformedError =>
          caught as DrivingOddityFileMalformedError,
      );

      expect(error.lineNumber).toBe(1);
    });

    it('ERROR: {a line missing the kind field} => throws rather than dropping the row', async () => {
      const proxy = drivingOddityReadBrokerProxy();
      proxy.setupRawFile({
        filePath: FILE_PATH,
        contents: '{"key":"GUILD_ADD_MODAL","line":"Click the wrapper."}\n',
      });

      const error = await drivingOddityReadBroker({ filePath: FILE_PATH }).then(
        (): never => {
          throw new Error('Expected drivingOddityReadBroker to reject');
        },
        (caught: unknown): DrivingOddityFileMalformedError =>
          caught as DrivingOddityFileMalformedError,
      );

      expect(error.name).toBe('DrivingOddityFileMalformedError');
    });
  });
});
