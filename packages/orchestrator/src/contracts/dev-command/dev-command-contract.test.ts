import { devCommandContract } from './dev-command-contract';
import { DevCommandStub } from './dev-command.stub';

describe('devCommandContract', () => {
  describe('valid values', () => {
    it('VALID: {npm run dev} => parses successfully', () => {
      const value = DevCommandStub({ value: 'npm run dev' });

      const result = devCommandContract.parse(value);

      expect(result).toBe('npm run dev');
    });

    it('VALID: {workspace dev command} => parses successfully', () => {
      const value = DevCommandStub({ value: 'npm run dev --workspace=@app/web' });

      const result = devCommandContract.parse(value);

      expect(result).toBe('npm run dev --workspace=@app/web');
    });
  });

  describe('invalid values', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        devCommandContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
