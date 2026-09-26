// Real Node streams (Readable.from / a Writable sink), not registerMock — readline's own
// question/answer handshake is the boundary this wrapper guards, and a real stream proves the
// trim/fallback/close behaviour the mocked interface's event shape cannot.
export const questionProxy = (): Record<PropertyKey, never> => ({});
