import { taskToolInputContract } from './task-tool-input-contract';
import { TaskToolInputStub } from './task-tool-input.stub';

describe('taskToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {description: "Run tests"} => parses task tool input', () => {
      const result = taskToolInputContract.parse({ description: 'Run tests' });

      expect(result).toStrictEqual({ description: 'Run tests' });
    });

    it('VALID: {description with extra fields} => passes through unknown fields', () => {
      const result = taskToolInputContract.parse({
        description: 'Run tests',
        prompt: 'Execute the test suite',
      });

      expect(result).toStrictEqual({ description: 'Run tests', prompt: 'Execute the test suite' });
    });

    it('VALID: {description: ""} => parses empty description', () => {
      const result = taskToolInputContract.parse({ description: '' });

      expect(result).toStrictEqual({ description: '' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing description} => throws', () => {
      expect(() => taskToolInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {description: null} => throws', () => {
      expect(() => taskToolInputContract.parse({ description: null })).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid task tool input', () => {
      const result = TaskToolInputStub();

      expect(result).toStrictEqual({ description: 'Run the test suite' });
    });

    it('VALID: {description: "Build project"} => creates with custom description', () => {
      const result = TaskToolInputStub({ description: 'Build project' });

      expect(result).toStrictEqual({ description: 'Build project' });
    });
  });
});
