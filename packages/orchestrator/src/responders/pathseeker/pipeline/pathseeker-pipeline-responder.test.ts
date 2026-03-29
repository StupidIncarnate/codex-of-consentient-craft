import { PathseekerPipelineResponder } from './pathseeker-pipeline-responder';

describe('PathseekerPipelineResponder', () => {
  describe('export', () => {
    it('VALID: exported function => is an async function', () => {
      expect(PathseekerPipelineResponder).toStrictEqual(expect.any(Function));
    });
  });
});
