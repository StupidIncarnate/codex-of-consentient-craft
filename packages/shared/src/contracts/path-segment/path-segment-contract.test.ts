import { pathSegmentContract } from './path-segment-contract';
import { PathSegmentStub } from './path-segment.stub';

describe('pathSegmentContract', () => {
  describe('valid path segments', () => {
    it('VALID: "src/guards" => parses as PathSegment', () => {
      const result = pathSegmentContract.parse('src/guards');

      expect(result).toBe('src/guards');
    });

    it('VALID: "basename.ts" => parses bare basename as PathSegment', () => {
      const result = pathSegmentContract.parse('basename.ts');

      expect(result).toBe('basename.ts');
    });

    it('VALID: "packages/mcp/src/foo.ts" => parses bare monorepo segment as PathSegment', () => {
      const result = pathSegmentContract.parse('packages/mcp/src/foo.ts');

      expect(result).toBe('packages/mcp/src/foo.ts');
    });

    it('VALID: "/abs/path.ts" => parses absolute-looking path as PathSegment (no prefix validation)', () => {
      const result = pathSegmentContract.parse('/abs/path.ts');

      expect(result).toBe('/abs/path.ts');
    });

    it('VALID: PathSegmentStub({value: "src/foo"}) => creates stub', () => {
      const result = PathSegmentStub({ value: 'src/foo' });

      expect(result).toBe('src/foo');
    });
  });
});
