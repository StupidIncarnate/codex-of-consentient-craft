import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';

import { inlineFailureMessageTransformer } from './inline-failure-message-transformer';

const RUN_ID = RunIdStub({ value: '1739625600000-a3f1' });
const DISPLAY_PATH = ErrorEntryStub({ filePath: 'packages/ward/src/a.test.ts' }).filePath;

const messageOf = ({ text }: { text: string }): ReturnType<typeof TestFailureStub>['message'] =>
  TestFailureStub({ message: text }).message;

describe('inlineFailureMessageTransformer', () => {
  describe('a message that fits', () => {
    // THE WHOLE POINT IS THE DIFF ARRIVING WHOLE. A jest `toStrictEqual` renders the expected and
    // received objects, and a reader who gets only the first line has to spend a `detail` call.
    it('VALID: {a 6-line toStrictEqual diff, cap 40} => returns every line untouched', () => {
      const text = [
        'expect(received).toStrictEqual(expected) // deep equality',
        '- Expected  - 1',
        '+ Received  + 1',
        '  Object {',
        '-   "durations": Array [],',
        '+   "durations": Array [ "4m" ],',
      ].join('\n');

      const result = inlineFailureMessageTransformer({
        message: messageOf({ text }),
        maxLines: 40,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe(text);
    });

    it('VALID: {a single-line message, cap 40} => returns that line', () => {
      const result = inlineFailureMessageTransformer({
        message: messageOf({ text: 'Timed out waiting for locator' }),
        maxLines: 40,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe('Timed out waiting for locator');
    });

    it('EDGE: {line count equals the cap} => returns every line, with no marker', () => {
      const text = ['a', 'b', 'c'].join('\n');

      const result = inlineFailureMessageTransformer({
        message: messageOf({ text }),
        maxLines: 3,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe('a\nb\nc');
    });

    // JEST PADS SOME MESSAGES. Counting the padding would report a trim that removed nothing.
    it('EDGE: {3 real lines and 4 trailing blanks, cap 3} => drops the blanks and adds no marker', () => {
      const result = inlineFailureMessageTransformer({
        message: messageOf({ text: 'a\nb\nc\n\n\n\n' }),
        maxLines: 3,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe('a\nb\nc');
    });
  });

  describe('a message over the cap', () => {
    it('VALID: {5 lines, cap 2} => returns 2 lines and a marker counting the other 3', () => {
      const result = inlineFailureMessageTransformer({
        message: messageOf({ text: 'a\nb\nc\nd\ne' }),
        maxLines: 2,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe(
        'a\nb\n... 3 more lines — npm run ward -- detail 1739625600000-a3f1 packages/ward/src/a.test.ts',
      );
    });

    // THE MARKER NAMES THE FILE as well as the run: `ward detail <runId>` alone prints the whole
    // run, which is the blob this transformer exists to keep a reader out of.
    it('VALID: {over the cap} => the marker names the two-argument detail command', () => {
      const result = inlineFailureMessageTransformer({
        message: messageOf({ text: 'a\nb\nc' }),
        maxLines: 1,
        runId: RunIdStub({ value: '1789069716853-949c' }),
        displayPath: ErrorEntryStub({ filePath: 'packages/web/src/b.test.tsx' }).filePath,
      });

      expect(result).toBe(
        'a\n... 2 more lines — npm run ward -- detail 1789069716853-949c packages/web/src/b.test.tsx',
      );
    });
  });

  describe('runner stack frames', () => {
    // MEASURED ON A REAL RUN: one `toStrictEqual` failure carried an eleven-line diff under fourteen
    // `jest-circus`/`jest-runner` frames. Nothing there names the caller's code, and left in they
    // spend a budget meant for diffs.
    it('VALID: {diff plus node_modules frames} => keeps the diff and the caller frame, drops the rest', () => {
      const text = [
        'expect(received).toStrictEqual(expected) // deep equality',
        '-     "maxLines": 41,',
        '+     "maxLines": 40,',
        '    at Object.<anonymous> (/repo/packages/ward/src/a.test.ts:8:34)',
        '    at Promise.finally.completed (/repo/node_modules/jest-circus/build/jestAdapterInit.js:1557:28)',
        '    at _runTest (/repo/node_modules/jest-runner/build/index.js:275:16)',
      ].join('\n');

      const result = inlineFailureMessageTransformer({
        message: messageOf({ text }),
        maxLines: 40,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe(
        [
          'expect(received).toStrictEqual(expected) // deep equality',
          '-     "maxLines": 41,',
          '+     "maxLines": 40,',
          '    at Object.<anonymous> (/repo/packages/ward/src/a.test.ts:8:34)',
        ].join('\n'),
      );
    });

    // THE DROP HAPPENS BEFORE THE COUNT, so frames a reader never sees cannot report a trim.
    it('VALID: {3 real lines and 3 dependency frames, cap 3} => adds no marker', () => {
      const text = [
        'a',
        'b',
        'c',
        '    at x (/repo/node_modules/jest-circus/build/a.js:1:1)',
        '    at y (/repo/node_modules/jest-runner/build/b.js:2:2)',
        '    at z (/repo/node_modules/jest-cli/build/c.js:3:3)',
      ].join('\n');

      const result = inlineFailureMessageTransformer({
        message: messageOf({ text }),
        maxLines: 3,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe('a\nb\nc');
    });

    it('EDGE: {a path merely containing the word node_modules in prose} => keeps that line', () => {
      const result = inlineFailureMessageTransformer({
        message: messageOf({ text: 'Cannot find module in node_modules resolution' }),
        maxLines: 40,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe('Cannot find module in node_modules resolution');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {message is an empty string} => returns an empty string', () => {
      const result = inlineFailureMessageTransformer({
        message: messageOf({ text: '' }),
        maxLines: 40,
        runId: RUN_ID,
        displayPath: DISPLAY_PATH,
      });

      expect(result).toBe('');
    });
  });
});
