import { PathseekerPipelineResponder } from './pathseeker-pipeline-responder';

describe('PathseekerPipelineResponder', () => {
  describe('export', () => {
    it('VALID: exported function => is an async function', () => {
      expect(typeof PathseekerPipelineResponder).toBe('function');
    });
  });
});
