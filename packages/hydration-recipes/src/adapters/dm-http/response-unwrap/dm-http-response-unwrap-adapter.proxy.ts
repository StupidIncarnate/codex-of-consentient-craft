/**
 * PURPOSE: Empty proxy for `dmHttpResponseUnwrapAdapter` — it is pure over the `DmHttpResponse` a
 * test builds with `DmHttpResponseStub`, so there is no I/O boundary here for `registerMock` to
 * address.
 *
 * USAGE:
 * dmHttpResponseUnwrapAdapterProxy();
 */
export const dmHttpResponseUnwrapAdapterProxy = (): Record<PropertyKey, never> => ({});
