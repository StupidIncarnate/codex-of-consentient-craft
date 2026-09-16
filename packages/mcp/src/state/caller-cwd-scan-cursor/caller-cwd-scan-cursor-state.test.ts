import { CallerCwdScanCursorStub } from '../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor.stub';
import { callerCwdScanCursorState } from './caller-cwd-scan-cursor-state';
import { callerCwdScanCursorStateProxy } from './caller-cwd-scan-cursor-state.proxy';

describe('callerCwdScanCursorState', () => {
  describe('set + getAll', () => {
    it('VALID: {one cursor set} => getAll returns it', () => {
      callerCwdScanCursorStateProxy().setupClear();
      const cursor = CallerCwdScanCursorStub({
        filepath: '/home/tester/.claude/projects/-x/a.jsonl' as never,
        offsetBytes: 10,
      });

      callerCwdScanCursorState.set({ cursor });

      expect(callerCwdScanCursorState.getAll()).toStrictEqual([cursor]);
    });

    it('VALID: {same filepath set twice} => the second value replaces the first, size stays 1', () => {
      callerCwdScanCursorStateProxy().setupClear();
      const filepath = '/home/tester/.claude/projects/-x/a.jsonl' as never;
      callerCwdScanCursorState.set({
        cursor: CallerCwdScanCursorStub({ filepath, offsetBytes: 10 }),
      });
      callerCwdScanCursorState.set({
        cursor: CallerCwdScanCursorStub({ filepath, offsetBytes: 99 }),
      });

      expect(callerCwdScanCursorState.getAll()).toStrictEqual([
        CallerCwdScanCursorStub({ filepath, offsetBytes: 99 }),
      ]);
    });

    it('VALID: {three cursors set in order} => getAll returns most-recently-used first', () => {
      callerCwdScanCursorStateProxy().setupClear();
      const a = CallerCwdScanCursorStub({ filepath: '/x/a.jsonl' as never, offsetBytes: 1 });
      const b = CallerCwdScanCursorStub({ filepath: '/x/b.jsonl' as never, offsetBytes: 2 });
      const c = CallerCwdScanCursorStub({ filepath: '/x/c.jsonl' as never, offsetBytes: 3 });

      callerCwdScanCursorState.set({ cursor: a });
      callerCwdScanCursorState.set({ cursor: b });
      callerCwdScanCursorState.set({ cursor: c });

      expect(callerCwdScanCursorState.getAll()).toStrictEqual([c, b, a]);
    });

    it('VALID: {re-setting an older entry} => it moves to most-recently-used', () => {
      callerCwdScanCursorStateProxy().setupClear();
      const a = CallerCwdScanCursorStub({ filepath: '/x/a.jsonl' as never, offsetBytes: 1 });
      const b = CallerCwdScanCursorStub({ filepath: '/x/b.jsonl' as never, offsetBytes: 2 });

      callerCwdScanCursorState.set({ cursor: a });
      callerCwdScanCursorState.set({ cursor: b });
      callerCwdScanCursorState.set({ cursor: a });

      expect(callerCwdScanCursorState.getAll()).toStrictEqual([a, b]);
    });
  });

  describe('eviction', () => {
    it('EDGE: {maxEntries + 1 distinct filepaths} => evicts the least-recently-used entry', () => {
      callerCwdScanCursorStateProxy().setupClear();

      for (let index = 0; index < 9; index += 1) {
        callerCwdScanCursorState.set({
          cursor: CallerCwdScanCursorStub({
            filepath: `/x/${String(index)}.jsonl` as never,
            offsetBytes: index,
          }),
        });
      }

      const remainingFilepaths = callerCwdScanCursorState.getAll().map((entry) => entry.filepath);

      expect(remainingFilepaths).toStrictEqual([
        '/x/8.jsonl',
        '/x/7.jsonl',
        '/x/6.jsonl',
        '/x/5.jsonl',
        '/x/4.jsonl',
        '/x/3.jsonl',
        '/x/2.jsonl',
        '/x/1.jsonl',
      ]);
    });
  });

  describe('clear', () => {
    it('EMPTY: {clear after set} => getAll returns empty', () => {
      callerCwdScanCursorStateProxy().setupClear();
      callerCwdScanCursorState.set({ cursor: CallerCwdScanCursorStub() });

      callerCwdScanCursorState.clear();

      expect(callerCwdScanCursorState.getAll()).toStrictEqual([]);
    });
  });
});
