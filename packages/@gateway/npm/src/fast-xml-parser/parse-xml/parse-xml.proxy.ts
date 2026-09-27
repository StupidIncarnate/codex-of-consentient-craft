// XMLParser#parse is a pure, synchronous parse over the string it is given — no filesystem, no
// network, no clock. The tests feed it real XML strings and read back what it really produces,
// the same reasoning pngjsDecodeAdapterProxy gives for leaving a deterministic npm call unmocked.
export const parseXmlProxy = (): Record<PropertyKey, never> => ({});
