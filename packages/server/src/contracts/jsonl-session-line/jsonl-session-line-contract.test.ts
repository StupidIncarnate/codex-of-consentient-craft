import { jsonlSessionLineContract } from './jsonl-session-line-contract';
import { JsonlSessionLineStub } from './jsonl-session-line.stub';

describe('jsonlSessionLineContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty object => parses successfully', () => {
      const result = JsonlSessionLineStub({});

      expect(result.type).toBe(undefined);
    });

    it('VALID: {type, summary} => parses with branded type', () => {
      const result = jsonlSessionLineContract.parse({ type: 'summary', summary: 'Built it' });

      expect(result.type).toBe('summary');
    });
  });
});
