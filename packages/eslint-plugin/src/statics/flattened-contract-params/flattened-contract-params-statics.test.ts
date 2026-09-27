import { flattenedContractParamsStatics } from './flattened-contract-params-statics';

describe('flattenedContractParamsStatics', () => {
  describe('limits', () => {
    it('VALID: {} => minimumDistinctProperties is 2, so one indexed field stays legal', () => {
      expect(flattenedContractParamsStatics.limits.minimumDistinctProperties).toBe(2);
    });
  });

  describe('exemptHosts', () => {
    it('VALID: {} => names lists every structural host exactly', () => {
      expect(flattenedContractParamsStatics.exemptHosts.names).toStrictEqual([
        'AriaAttributes',
        'AriaRole',
        'Array',
        'CSSProperties',
        'Document',
        'Element',
        'Event',
        'JSX',
        'Map',
        'Node',
        'Parameters',
        'Partial',
        'Promise',
        'React',
        'Readonly',
        'Record',
        'Required',
        'ReturnType',
        'Set',
        'TSESTree',
        'Window',
      ]);
    });

    it('VALID: {} => prefixes covers the DOM element families', () => {
      expect(flattenedContractParamsStatics.exemptHosts.prefixes).toStrictEqual(['HTML', 'SVG']);
    });

    it('VALID: {} => suffixes covers the event bags', () => {
      expect(flattenedContractParamsStatics.exemptHosts.suffixes).toStrictEqual(['Event']);
    });

    it('VALID: {} => names is sorted, so a new entry has one obvious home', () => {
      expect(flattenedContractParamsStatics.exemptHosts.names).toStrictEqual(
        [...flattenedContractParamsStatics.exemptHosts.names].sort((a, b) => a.localeCompare(b)),
      );
    });
  });
});
