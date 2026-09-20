// PNG.sync.read is a pure, synchronous decoder over the bytes it is given — no filesystem, no
// network, no clock. The tests build real tiny PNGs with PNG.sync.write and decode them for real,
// the same reasoning cryptoHashAdapterProxy gives for leaving a deterministic npm call unmocked.
export const pngjsDecodeAdapterProxy = (): Record<PropertyKey, never> => ({});
