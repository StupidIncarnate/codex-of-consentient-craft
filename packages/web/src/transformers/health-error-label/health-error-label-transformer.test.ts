import { healthErrorLabelTransformer } from './health-error-label-transformer';

describe('healthErrorLabelTransformer', () => {
  it('VALID: {message: "GET /api/health failed with status 500"} => returns "HTTP 500"', () => {
    expect(healthErrorLabelTransformer({ message: 'GET /api/health failed with status 500' })).toBe(
      'HTTP 500',
    );
  });

  it('VALID: {message: "GET /api/health failed with status 404"} => returns "HTTP 404", the status is captured rather than hardcoded', () => {
    expect(healthErrorLabelTransformer({ message: 'GET /api/health failed with status 404' })).toBe(
      'HTTP 404',
    );
  });

  it('VALID: {message: "Failed to fetch"} => returns "NO RESPONSE"', () => {
    expect(healthErrorLabelTransformer({ message: 'Failed to fetch' })).toBe('NO RESPONSE');
  });

  it('VALID: {message: "WebSocket connection lost"} => returns "CONNECTION LOST"', () => {
    expect(healthErrorLabelTransformer({ message: 'WebSocket connection lost' })).toBe(
      'CONNECTION LOST',
    );
  });

  it('INVALID: {message: ZodError text from an unparseable 200 body} => returns "NO RESPONSE", the same as no usable response at all', () => {
    const zodErrorMessage =
      '[\n' +
      '  {\n' +
      '    "code": "invalid_type",\n' +
      '    "expected": "number",\n' +
      '    "received": "undefined",\n' +
      '    "path": [\n' +
      '      "uptimeSeconds"\n' +
      '    ],\n' +
      '    "message": "Required"\n' +
      '  }\n' +
      ']';

    expect(healthErrorLabelTransformer({ message: zodErrorMessage })).toBe('NO RESPONSE');
  });

  it('EMPTY: {message: ""} => returns "NO RESPONSE"', () => {
    expect(healthErrorLabelTransformer({ message: '' })).toBe('NO RESPONSE');
  });
});
