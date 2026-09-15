import { nodeLabelContract } from './node-label-contract';
import { NodeLabelStub } from './node-label.stub';

describe('nodeLabelContract', () => {
  it('VALID: {value: "open-guild-modal"} => parses successfully', () => {
    const nodeLabel = NodeLabelStub({ value: 'open-guild-modal' });

    const result = nodeLabelContract.parse(nodeLabel);

    expect(result).toBe('open-guild-modal');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      nodeLabelContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('EDGE: {value: "a"} => a single-character label parses successfully', () => {
    const result = nodeLabelContract.parse('a');

    expect(result).toBe('a');
  });
});
