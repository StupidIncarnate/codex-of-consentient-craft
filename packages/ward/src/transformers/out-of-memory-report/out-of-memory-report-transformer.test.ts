import { outOfMemoryReportTransformer } from './out-of-memory-report-transformer';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { RawOutputStub } from '../../contracts/raw-output/raw-output.stub';
import { ProcessSignalStub } from '@dungeonmaster/shared/contracts';

describe('outOfMemoryReportTransformer', () => {
  describe('V8 heap limit', () => {
    it("VALID: {banner on stderr, exit 134} => names the heap limit, because V8's own words prove it", () => {
      const result = outOfMemoryReportTransformer({
        projectFolder: ProjectFolderStub({ name: 'web' }),
        rawOutput: RawOutputStub({
          exitCode: 134,
          stderr: 'FATAL ERROR: Ineffective mark-compacts - JavaScript heap out of memory',
        }),
      });

      expect(String(result)).toBe(
        '  web  exit 134  V8 heap limit — the check printed "JavaScript heap out of memory" and aborted',
      );
    });

    it('VALID: {banner on stdout} => still names the heap limit', () => {
      const result = outOfMemoryReportTransformer({
        projectFolder: ProjectFolderStub({ name: 'mcp' }),
        rawOutput: RawOutputStub({ exitCode: 1, stdout: 'JavaScript heap out of memory' }),
      });

      expect(String(result)).toBe(
        '  mcp  exit 1  V8 heap limit — the check printed "JavaScript heap out of memory" and aborted',
      );
    });
  });

  describe('abort without the banner', () => {
    it('VALID: {exit 134, output lost} => names the abort rather than claiming the banner was seen', () => {
      const result = outOfMemoryReportTransformer({
        projectFolder: ProjectFolderStub({ name: 'shared' }),
        rawOutput: RawOutputStub({ exitCode: 134 }),
      });

      expect(String(result)).toBe(
        '  shared  exit 134  the process aborted (SIGABRT), which is how V8 ends a run it cannot allocate for',
      );
    });

    it('VALID: {signal SIGABRT} => reports the signal in place of the exit code', () => {
      const result = outOfMemoryReportTransformer({
        projectFolder: ProjectFolderStub({ name: 'shared' }),
        rawOutput: RawOutputStub({
          exitCode: 1,
          signal: ProcessSignalStub({ value: 'SIGABRT' }),
        }),
      });

      expect(String(result)).toBe(
        '  shared  SIGABRT  the process aborted (SIGABRT), which is how V8 ends a run it cannot allocate for',
      );
    });
  });

  describe('killed from outside', () => {
    it('VALID: {signal SIGKILL, nothing printed} => names the reaper, the only reading a silent kill supports', () => {
      const result = outOfMemoryReportTransformer({
        projectFolder: ProjectFolderStub({ name: 'orchestrator' }),
        rawOutput: RawOutputStub({
          exitCode: 1,
          signal: ProcessSignalStub({ value: 'SIGKILL' }),
        }),
      });

      expect(String(result)).toBe(
        '  orchestrator  SIGKILL  the process was killed from outside (SIGKILL) — on a machine running checks that is the kernel out-of-memory reaper',
      );
    });
  });
});
