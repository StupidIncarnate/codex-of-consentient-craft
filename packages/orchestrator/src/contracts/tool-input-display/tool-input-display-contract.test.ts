import { toolInputDisplayContract } from './tool-input-display-contract';
import { ToolInputDisplayStub } from './tool-input-display.stub';

describe('toolInputDisplayContract', () => {
  describe('valid inputs', () => {
    it('VALID: {single param} => parses successfully', () => {
      const display = ToolInputDisplayStub({ value: 'pattern="*.ts"' });

      const result = toolInputDisplayContract.parse(display);

      expect(result).toBe('pattern="*.ts"');
    });

    it('VALID: {multiple params} => parses successfully', () => {
      const display = ToolInputDisplayStub({ value: 'pattern="*.ts" path="src/"' });

      const result = toolInputDisplayContract.parse(display);

      expect(result).toBe('pattern="*.ts" path="src/"');
    });

    it('VALID: {empty string} => parses successfully', () => {
      const display = ToolInputDisplayStub({ value: '' });

      const result = toolInputDisplayContract.parse(display);

      expect(result).toBe('');
    });

    it('VALID: {with ellipsis} => parses successfully', () => {
      const display = ToolInputDisplayStub({ value: 'file_path="/long/path/to/..." ...' });

      const result = toolInputDisplayContract.parse(display);

      expect(result).toBe('file_path="/long/path/to/..." ...');
    });
  });
});
