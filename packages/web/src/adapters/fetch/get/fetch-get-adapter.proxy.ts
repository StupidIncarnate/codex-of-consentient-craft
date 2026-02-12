globalThis.fetch = jest.fn() as typeof fetch;

const OK_RANGE_MIN = 200;
const OK_RANGE_MAX = 300;
const HTTP_OK = 200;

const createMockResponse = ({ body, status }: { body: string; status: number }): Response =>
  ({
    ok: status >= OK_RANGE_MIN && status < OK_RANGE_MAX,
    status,
    json: async () => Promise.resolve(JSON.parse(body) as unknown),
  }) as Response;

export const fetchGetAdapterProxy = (): {
  resolves: (params: { data: unknown }) => void;
  rejects: (params: { error: Error }) => void;
  resolvesWithStatus: (params: { status: number; body: string }) => void;
} => {
  const mock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(createMockResponse({ body: '{}', status: HTTP_OK }));

  return {
    resolves: ({ data }: { data: unknown }) => {
      mock.mockResolvedValueOnce(
        createMockResponse({ body: JSON.stringify(data), status: HTTP_OK }),
      );
    },

    rejects: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },

    resolvesWithStatus: ({ status, body }: { status: number; body: string }) => {
      mock.mockResolvedValueOnce(createMockResponse({ body, status }));
    },
  };
};
