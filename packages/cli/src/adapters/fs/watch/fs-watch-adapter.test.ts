import { fsWatchAdapter } from './fs-watch-adapter';
import { fsWatchAdapterProxy } from './fs-watch-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsWatchAdapter', () => {
  describe('successful watch operations', () => {
    it('VALID: {dirPath: "/quests"} => calls onChange when file changes', () => {
      const proxy = fsWatchAdapterProxy();
      const dirPath = FilePathStub({ value: '/quests' });
      const onChangeMock = jest.fn();

      const watcher = fsWatchAdapter({ dirPath, onChange: onChangeMock });
      proxy.emitsChange({ filename: 'signal.json' });
      watcher.close();

      expect(onChangeMock).toHaveBeenCalledWith({ filename: 'signal.json' });
    });

    it('VALID: {dirPath: "/quests"} => calls onChange multiple times for multiple changes', () => {
      const proxy = fsWatchAdapterProxy();
      const dirPath = FilePathStub({ value: '/quests' });
      const onChangeMock = jest.fn();

      const watcher = fsWatchAdapter({ dirPath, onChange: onChangeMock });
      proxy.emitsChange({ filename: 'file1.json' });
      proxy.emitsChange({ filename: 'file2.json' });
      watcher.close();

      expect(onChangeMock).toHaveBeenNthCalledWith(1, { filename: 'file1.json' });
      expect(onChangeMock).toHaveBeenNthCalledWith(2, { filename: 'file2.json' });
    });

    it('VALID: {dirPath: "/quests"} => returns watcher with close method', () => {
      fsWatchAdapterProxy();
      const dirPath = FilePathStub({ value: '/quests' });
      const onChangeMock = jest.fn();

      const watcher = fsWatchAdapter({ dirPath, onChange: onChangeMock });
      watcher.close();

      expect(typeof watcher.close).toBe('function');
    });

    it('VALID: {dirPath: "/quests"} => close stops the watcher', () => {
      const proxy = fsWatchAdapterProxy();
      const dirPath = FilePathStub({ value: '/quests' });
      const onChangeMock = jest.fn();

      const watcher = fsWatchAdapter({ dirPath, onChange: onChangeMock });
      watcher.close();

      expect(proxy.wasClosed()).toBe(true);
    });
  });

  describe('error conditions', () => {
    it('ERROR: {dirPath: "/nonexistent"} => throws when directory does not exist', () => {
      const proxy = fsWatchAdapterProxy();
      const dirPath = FilePathStub({ value: '/nonexistent' });
      const onChangeMock = jest.fn();

      proxy.throwsOnWatch({ error: new Error('ENOENT: no such file or directory') });

      expect(() => fsWatchAdapter({ dirPath, onChange: onChangeMock })).toThrow(/ENOENT/u);
    });
  });
});
