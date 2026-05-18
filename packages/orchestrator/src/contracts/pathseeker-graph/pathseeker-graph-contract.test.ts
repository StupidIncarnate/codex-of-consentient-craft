import { pathseekerGraphContract } from './pathseeker-graph-contract';
import { PathseekerGraphStub } from './pathseeker-graph.stub';

describe('pathseekerGraphContract', () => {
  it('VALID: {default stub} => parses to empty workItems and slices', () => {
    const stub = PathseekerGraphStub();

    const result = pathseekerGraphContract.parse(stub);

    expect(result).toStrictEqual({ workItems: [], slices: [] });
  });

  it('INVALID: {missing workItems} => throws zod error', () => {
    expect(() => pathseekerGraphContract.parse({ slices: [] })).toThrow(/Required/u);
  });

  it('INVALID: {missing slices} => throws zod error', () => {
    expect(() => pathseekerGraphContract.parse({ workItems: [] })).toThrow(/Required/u);
  });
});
