import { architectureExcludedAuditBroker } from './architecture-excluded-audit-broker';
import { architectureExcludedAuditBrokerProxy } from './architecture-excluded-audit-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });
const PACKAGE_NAME = ContentTextStub({ value: 'shared' });
const SRC = `${String(PACKAGE_ROOT)}/src`;

// Column width = 15 ('transformers/'.length + 2).
// guards/ (7) → 8 spaces; contracts/ (10) → 5 spaces; transformers/ (13) → 2 spaces; assets/ (7) → 8 spaces.
// Continuation indent: 15 spaces.

describe('architectureExcludedAuditBroker', () => {
  describe('all excluded folders are empty', () => {
    it('EMPTY: {no files in any excluded folder} => output starts with --- separator', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines[0]).toBe('---');
    });

    it('EMPTY: {no files in any excluded folder} => section header is present', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) => l === '## Excluded categories — files filtered out of the trace by configuration',
        ),
      ).toBe(true);
    });

    it('EMPTY: {no files in any excluded folder} => guards row shows (none on this path)', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'guards/        (none on this path)')).toBe(true);
    });

    it('EMPTY: {no files in any excluded folder} => transformers row shows (none on this path)', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'transformers/  (none on this path)')).toBe(true);
    });

    it('EMPTY: {no files in any excluded folder} => contracts row shows (none on this path)', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'contracts/     (none on this path)')).toBe(true);
    });

    it('EMPTY: {no files in any excluded folder} => assets row shows (none on this path)', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'assets/        (none on this path)')).toBe(true);
    });
  });

  describe('files present in all four excluded folders', () => {
    it('VALID: {one file per excluded folder} => guards row renders file name', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/transformers/safe-json-parse/safe-json-parse-transformer.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/contracts/content-text/content-text-contract.ts`,
          }),
          AbsoluteFilePathStub({ value: `${SRC}/assets/logo.svg` }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'guards/        shared/guards/is-non-test-file-guard')).toBe(
        true,
      );
    });

    it('VALID: {one file per excluded folder} => transformers row renders file name', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/transformers/safe-json-parse/safe-json-parse-transformer.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/contracts/content-text/content-text-contract.ts`,
          }),
          AbsoluteFilePathStub({ value: `${SRC}/assets/logo.svg` }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === 'transformers/  shared/transformers/safe-json-parse-transformer'),
      ).toBe(true);
    });

    it('VALID: {one file per excluded folder} => contracts row renders file name', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/transformers/safe-json-parse/safe-json-parse-transformer.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/contracts/content-text/content-text-contract.ts`,
          }),
          AbsoluteFilePathStub({ value: `${SRC}/assets/logo.svg` }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'contracts/     shared/contracts/content-text-contract')).toBe(
        true,
      );
    });

    it('VALID: {one file per excluded folder} => assets row renders file name', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/transformers/safe-json-parse/safe-json-parse-transformer.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/contracts/content-text/content-text-contract.ts`,
          }),
          AbsoluteFilePathStub({ value: `${SRC}/assets/logo.svg` }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'assets/        shared/assets/logo')).toBe(true);
    });
  });

  describe('folder with multiple files', () => {
    it('VALID: {two files in guards} => first file appears on label line', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-source-file/is-source-file-guard.ts`,
          }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'guards/        shared/guards/is-non-test-file-guard')).toBe(
        true,
      );
    });

    it('VALID: {two files in guards} => second file appears on continuation line with 15-space indent', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-source-file/is-source-file-guard.ts`,
          }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '               shared/guards/is-source-file-guard')).toBe(
        true,
      );
    });
  });

  describe('test and proxy files filtered out', () => {
    it('VALID: {guards folder with impl + test + proxy files} => only impl file listed', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.test.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.proxy.ts`,
          }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');
      // Exactly one line starts with 'guards/' and it has only the impl file
      const guardsLabelLines = lines.filter((l) => l.startsWith('guards/'));

      expect(guardsLabelLines).toStrictEqual([
        'guards/        shared/guards/is-non-test-file-guard',
      ]);
    });

    it('VALID: {guards folder with impl + test + proxy files} => no continuation line for guards', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.test.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.stub.ts`,
          }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');
      const continuationGuardsLines = lines.filter(
        (l) => l === '               shared/guards/is-non-test-file-guard',
      );

      expect(continuationGuardsLines).toStrictEqual([]);
    });
  });

  describe('recursive directory walk', () => {
    it('VALID: {three files nested under separate subdirs in guards} => all three listed', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupVirtualTree({
        filePaths: [
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-non-test-file/is-non-test-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-source-file/is-source-file-guard.ts`,
          }),
          AbsoluteFilePathStub({
            value: `${SRC}/guards/is-startable-quest-status/is-startable-quest-status-guard.ts`,
          }),
        ],
      });

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'guards/        shared/guards/is-non-test-file-guard')).toBe(
        true,
      );
      expect(lines.some((l) => l === '               shared/guards/is-source-file-guard')).toBe(
        true,
      );
      expect(
        lines.some((l) => l === '               shared/guards/is-startable-quest-status-guard'),
      ).toBe(true);
    });
  });

  describe('output structure', () => {
    it('VALID: {any package} => output contains exactly two fenced code block markers', () => {
      const proxy = architectureExcludedAuditBrokerProxy();
      proxy.setupEmpty();

      const result = architectureExcludedAuditBroker({
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      const lines = String(result).split('\n');
      const fenceCount = lines.filter((l) => l === '```').length;

      expect(fenceCount).toBe(2);
    });
  });
});
