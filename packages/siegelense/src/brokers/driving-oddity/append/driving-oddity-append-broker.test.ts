import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { DrivingOddityStub } from '../../../contracts/driving-oddity/driving-oddity.stub';
import type { DrivingOddityDuplicateKeyError } from '../../../errors/driving-oddity-duplicate-key/driving-oddity-duplicate-key-error';

import { drivingOddityAppendBroker } from './driving-oddity-append-broker';
import { drivingOddityAppendBrokerProxy } from './driving-oddity-append-broker.proxy';

const FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
});

describe('drivingOddityAppendBroker', () => {
  describe('an empty file', () => {
    it('VALID: {one entry} => appends one JSON line and returns success', async () => {
      const proxy = drivingOddityAppendBrokerProxy();
      proxy.setupEmptyFile({ filePath: FILE_PATH });
      const entry = DrivingOddityStub({
        key: 'GUILD_ADD_MODAL',
        line: 'Click the wrapper, not the label.',
        kind: 'quirk',
      });

      const result = await drivingOddityAppendBroker({ filePath: FILE_PATH, entry });

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {one entry} => the appended line is the entry as newline-terminated JSON', async () => {
      const proxy = drivingOddityAppendBrokerProxy();
      proxy.setupEmptyFile({ filePath: FILE_PATH });
      const entry = DrivingOddityStub({
        key: 'GUILD_ADD_MODAL',
        line: 'Click the wrapper, not the label.',
        kind: 'quirk',
      });

      await drivingOddityAppendBroker({ filePath: FILE_PATH, entry });

      expect(proxy.appendedLinesFor({ filePath: FILE_PATH })).toStrictEqual([
        `${JSON.stringify(entry)}\n`,
      ]);
    });
  });

  describe('a file already holding entries', () => {
    it('VALID: {a new key} => appends beside the existing entry and returns success', async () => {
      const proxy = drivingOddityAppendBrokerProxy();
      const existing = DrivingOddityStub({ key: 'GUILD_ADD_MODAL' });
      proxy.setupExistingEntries({ filePath: FILE_PATH, entries: [existing] });
      const entry = DrivingOddityStub({
        key: 'PIXEL_BTN',
        line: 'This appears twice under GUILD_SESSION_LIST.',
        kind: 'defect',
      });

      const result = await drivingOddityAppendBroker({ filePath: FILE_PATH, entry });

      expect(result).toStrictEqual({ success: true });
    });

    it('ERROR: {a key already in the file} => refuses rather than rewriting the existing entry', async () => {
      const proxy = drivingOddityAppendBrokerProxy();
      const existing = DrivingOddityStub({
        key: 'GUILD_ADD_MODAL',
        line: 'Click the wrapper, not the label.',
        kind: 'quirk',
      });
      proxy.setupExistingEntries({ filePath: FILE_PATH, entries: [existing] });
      const entry = DrivingOddityStub({
        key: 'GUILD_ADD_MODAL',
        line: 'A different line entirely.',
        kind: 'defect',
      });

      const error = await drivingOddityAppendBroker({ filePath: FILE_PATH, entry }).then(
        (): never => {
          throw new Error('Expected drivingOddityAppendBroker to reject');
        },
        (caught: unknown): DrivingOddityDuplicateKeyError =>
          caught as DrivingOddityDuplicateKeyError,
      );

      expect({ name: error.name, key: error.key, filePath: error.filePath }).toStrictEqual({
        name: 'DrivingOddityDuplicateKeyError',
        key: 'GUILD_ADD_MODAL',
        filePath: FILE_PATH,
      });
    });

    it('ERROR: {a duplicate key} => never reaches the append adapter', async () => {
      const proxy = drivingOddityAppendBrokerProxy();
      const existing = DrivingOddityStub({ key: 'GUILD_ADD_MODAL' });
      proxy.setupExistingEntries({ filePath: FILE_PATH, entries: [existing] });
      const entry = DrivingOddityStub({ key: 'GUILD_ADD_MODAL' });

      await drivingOddityAppendBroker({ filePath: FILE_PATH, entry }).then(
        (): never => {
          throw new Error('Expected drivingOddityAppendBroker to reject');
        },
        (): undefined => undefined,
      );

      expect(proxy.appendedLinesFor({ filePath: FILE_PATH })).toStrictEqual([]);
    });
  });
});
