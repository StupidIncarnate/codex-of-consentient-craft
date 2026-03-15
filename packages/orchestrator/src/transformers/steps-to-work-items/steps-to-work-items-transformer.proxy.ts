export const stepsToWorkItemsTransformerProxy = (): {
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
} => {
  const uuidMock = jest.spyOn(crypto, 'randomUUID');

  return {
    setupUuids: ({
      uuids,
    }: {
      uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const uuid of uuids) {
        uuidMock.mockReturnValueOnce(uuid);
      }
    },
  };
};
