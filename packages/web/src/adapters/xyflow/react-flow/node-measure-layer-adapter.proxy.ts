interface NodeMeasureLayerAdapterProxyResult {
  setupUnmeasuredGraph: () => void;
  setupMeasuredGraph: () => void;
  getForcedMeasureIds: () => readonly (readonly Element['id'][])[];
}

// Mirrors the attribute names the jsdom `@xyflow/react` mock reads and writes. Node measurement is
// browser layout, which jsdom does not resolve, so the mock stands in for React Flow's store through
// the DOM and this proxy is the only place a test touches it.
const NODES_INITIALIZED_ATTR = 'data-nodes-initialized';
const FORCED_MEASURE_ATTR = 'data-forced-measure-ids';
const CALL_SEPARATOR = '|';
const ID_SEPARATOR = '\n';

export const nodeMeasureLayerAdapterProxy = (): NodeMeasureLayerAdapterProxyResult => ({
  // React Flow's `nodesInitialized` is its graph-wide "has every node got dimensions" answer. Both
  // setups clear the recording first: <body> is the one node testing-library never cleans between
  // tests, so without that a test would read the previous test's forced measurements as its own.
  setupUnmeasuredGraph: (): void => {
    document.body.removeAttribute(FORCED_MEASURE_ATTR);
    document.body.setAttribute(NODES_INITIALIZED_ATTR, 'false');
  },
  setupMeasuredGraph: (): void => {
    document.body.removeAttribute(FORCED_MEASURE_ATTR);
    document.body.setAttribute(NODES_INITIALIZED_ATTR, 'true');
  },
  getForcedMeasureIds: (): readonly (readonly Element['id'][])[] => {
    const recorded = document.body.getAttribute(FORCED_MEASURE_ATTR);
    if (recorded === null || recorded === '') {
      return [];
    }
    return recorded.split(CALL_SEPARATOR).map((call) => call.split(ID_SEPARATOR));
  },
});
