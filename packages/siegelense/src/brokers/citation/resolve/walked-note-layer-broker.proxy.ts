// The quest and the quest file path both arrive as parameters and nothing here reads disk, a clock
// or the registry — the layer is a pure filter over notes the caller already loaded, so it runs
// real in every test with nothing to stage.
export const walkedNoteLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
