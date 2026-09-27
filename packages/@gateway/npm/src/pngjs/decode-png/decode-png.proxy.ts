// PNG.sync.read is a pure, synchronous decoder over the bytes it is given — no filesystem, no
// network, no clock. The tests build real tiny PNGs with PNG.sync.write and decode them for real.
export const decodePngProxy = (): Record<PropertyKey, never> => ({});
