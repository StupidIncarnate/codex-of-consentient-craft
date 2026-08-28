import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { hasNoFilesProcessedGuard } from './has-no-files-processed-guard';

describe('hasNoFilesProcessedGuard', () => {
  // THE SHAPE THIS EXISTS FOR: `npm run ward -- --only lint -- scripts/build-workspaces.mjs`. The
  // path matches no workspace package, so no child ward spawns, `projectResults` is empty, and
  // `checkResultBuildTransformer` grades that as `pass`.
  describe('a run that examined nothing', () => {
    it('VALID: {lint passed with no projectResults} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [CheckResultStub({ checkType: 'lint', status: 'pass', projectResults: [] })],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(true);
    });

    it('VALID: {lint passed, one project reporting filesCount 0} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(true);
    });
  });

  describe('a run that examined something', () => {
    it('VALID: {lint processed one file} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 1 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    // ONE CHECK PROCESSING SOMETHING IS ENOUGH — the answer is about the run, not about each check.
    // `--only lint,unit -- src/a.ts` where eslint linted the file and jest found no related test is
    // a scoped run that did its job.
    it('VALID: {lint processed one file, unit processed none} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 1 })],
          }),
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    // Jest's `--findRelatedTests` reports the related TEST file, not the source file it was handed —
    // so a scoped `--only unit -- src/statics/foo.ts` shows up here as unit processing files.
    it('VALID: {unit processed the related test file} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 5 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });
  });

  // TYPECHECK CANNOT VOUCH FOR A PATH. `tsc` has no per-file mode, so ward runs it whole-package:
  // measured live, `--only typecheck -- scripts/build-workspaces.mjs` reported 6145 files for a path
  // tsc never saw. Counting it would make this guard answer false for every run including typecheck.
  describe('typecheck, which ignores file scope', () => {
    it('VALID: {typecheck processed 6145 files, lint processed none} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 0 })],
          }),
          CheckResultStub({
            checkType: 'typecheck',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 6145 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(true);
    });

    it('VALID: {typecheck is the only check that ran} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'typecheck',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 6145 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });
  });

  // A skip is not evidence either way: Jest's "No tests found" on a scoped run becomes `skip`, and a
  // package that is not e2e-eligible skips e2e outright. Neither says the scope was wrong.
  describe('checks that skipped', () => {
    it('VALID: {unit skipped, lint processed one file} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', filesCount: 1 })],
          }),
          CheckResultStub({
            checkType: 'unit',
            status: 'skip',
            projectResults: [ProjectResultStub({ status: 'skip', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    it('VALID: {every file-scoped check skipped} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'e2e',
            status: 'skip',
            projectResults: [ProjectResultStub({ status: 'skip', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });
  });

  // A CRASHED CHILD MEASURED NOTHING, so its zero is a placeholder rather than a reading.
  // `commandRunLayerChildCrashBroker` synthesises a failing ProjectResult with `filesCount` left at
  // its contract default of 0 for a child ward that died without writing a readable result. Read
  // literally, that zero printed "they are on disk, and every file-scoped check in this run reported
  // 0 files" underneath the crash report, sending the reader to inspect paths that were never the
  // problem.
  describe('packages whose child ward crashed', () => {
    it('VALID: {lint has one crashed project and nothing else} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [ProjectResultStub({ status: 'fail', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    it('VALID: {every file-scoped check holds only crashed projects} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [ProjectResultStub({ status: 'fail', filesCount: 0 })],
          }),
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [ProjectResultStub({ status: 'fail', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    // A CRASH DOES NOT BUY THE REST OF THE RUN AN ALIBI. One package died and another really did
    // look at the scope and find nothing in it — two separate problems, and the second is still
    // true, so it is still reported.
    it('VALID: {lint has one crashed project and one that really processed nothing} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({ status: 'fail', filesCount: 0 }),
              ProjectResultStub({ status: 'pass', filesCount: 0 }),
            ],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(true);
    });

    it('VALID: {unit holds only a crashed project, lint really processed nothing} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({ checkType: 'lint', status: 'pass', projectResults: [] }),
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [ProjectResultStub({ status: 'fail', filesCount: 0 })],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(true);
    });

    it('VALID: {lint has one crashed project and one that processed a file} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({ status: 'fail', filesCount: 0 }),
              ProjectResultStub({ status: 'pass', filesCount: 1 }),
            ],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    // A REAL FAILURE IS A MEASUREMENT. eslint reporting errors on a file it opened is a project
    // that processed something, so the check keeps counting — only the finding-less fail of a dead
    // process is dropped.
    it('VALID: {lint failed with errors and processed nothing} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({ status: 'fail', filesCount: 0, errors: [ErrorEntryStub()] }),
            ],
          }),
        ],
      });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(true);
    });
  });

  describe('nothing to judge', () => {
    it('EMPTY: {checks: []} => returns false', () => {
      const wardResult = WardResultStub({ checks: [] });

      expect(hasNoFilesProcessedGuard({ wardResult })).toBe(false);
    });

    it('EMPTY: {wardResult omitted} => returns false', () => {
      expect(hasNoFilesProcessedGuard({})).toBe(false);
    });
  });
});
