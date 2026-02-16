import { treeOutputContract as _treeOutputContract } from './tree-output-contract';
import { TreeOutputStub } from './tree-output.stub';

describe('treeOutputContract', () => {
  it('VALID: {value: "guards/\\n  has-permission-guard (guard)"} => parses successfully', () => {
    const result = TreeOutputStub({ value: 'guards/\n  has-permission-guard (guard)' });

    expect(result).toBe('guards/\n  has-permission-guard (guard)');
  });

  it('VALID: {value: "brokers/\\n  user-fetch-broker (broker)"} => parses successfully', () => {
    const result = TreeOutputStub({ value: 'brokers/\n  user-fetch-broker (broker)' });

    expect(result).toBe('brokers/\n  user-fetch-broker (broker)');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = TreeOutputStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "transformers/\\n  format-date-transformer (transformer) - Formats dates"} => parses successfully with purpose', () => {
    const result = TreeOutputStub({
      value: 'transformers/\n  format-date-transformer (transformer) - Formats dates',
    });

    expect(result).toBe('transformers/\n  format-date-transformer (transformer) - Formats dates');
  });
});
