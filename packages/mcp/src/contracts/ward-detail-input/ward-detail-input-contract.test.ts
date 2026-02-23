import { wardDetailInputContract as _wardDetailInputContract } from './ward-detail-input-contract';
import { WardDetailInputStub } from './ward-detail-input.stub';

describe('wardDetailInputContract', () => {
  it('VALID: {runId, filePath} => parses successfully', () => {
    const result = WardDetailInputStub({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
    });

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
    });
  });

  it('VALID: {runId, filePath, verbose} => parses successfully with verbose', () => {
    const result = WardDetailInputStub({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
      verbose: true,
    });

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
      verbose: true,
    });
  });

  it('VALID: {runId, filePath, packagePath} => parses successfully with packagePath', () => {
    const result = WardDetailInputStub({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
      packagePath: 'packages/mcp',
    });

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
      packagePath: 'packages/mcp',
    });
  });

  it('VALID: default stub values => parses successfully', () => {
    const result = WardDetailInputStub();

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      filePath: 'src/app.ts',
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_RUN_ID: {runId: "bad"} => throws validation error', () => {
      expect(() => {
        _wardDetailInputContract.parse({
          runId: 'bad',
          filePath: 'src/app.ts',
        });
      }).toThrow(/Invalid RunId format/u);
    });

    it('INVALID_FILE_PATH: {filePath: missing} => throws validation error', () => {
      expect(() => {
        _wardDetailInputContract.parse({
          runId: '1739625600000-a3f1',
        });
      }).toThrow(/Required/u);
    });
  });
});
