import { outcomeTypeDescriptionsStatics } from './outcome-type-descriptions-statics';

describe('outcomeTypeDescriptionsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(outcomeTypeDescriptionsStatics).toStrictEqual({
      'api-call': 'Assert an HTTP request was made with correct method/path/body',
      'file-exists': 'Assert a file/directory exists or was removed on disk',
      environment: 'Assert environment variables or runtime config are set correctly',
      'log-output': 'Assert specific log lines were written to stdout/stderr',
      'process-state': 'Assert a process is running, exited, or in expected state',
      performance: 'Assert response time or throughput meets threshold',
      'ui-state': 'Assert visible DOM state (element exists, text content, disabled state, CSS)',
      'cache-state': 'Assert cache entries exist, expired, or were invalidated',
      'db-query': 'Assert database rows were created, updated, or deleted',
      'queue-message': 'Assert a message was enqueued or dequeued',
      'external-api': 'Assert an outbound call to a third-party API was made correctly',
      custom: 'Project-specific assertion — read the description for details',
    });
  });
});
