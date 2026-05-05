import { identifierTokenizeTransformer } from './identifier-tokenize-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('identifierTokenizeTransformer', () => {
  it('VALID: {OrchestrationEventType} => splits PascalCase on case boundaries', () => {
    const result = identifierTokenizeTransformer({ identifier: 'OrchestrationEventType' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'Orchestration' }),
      ContentTextStub({ value: 'Event' }),
      ContentTextStub({ value: 'Type' }),
    ]);
  });

  it('VALID: {orchestrationEventType} => splits camelCase on case boundaries', () => {
    const result = identifierTokenizeTransformer({ identifier: 'orchestrationEventType' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'orchestration' }),
      ContentTextStub({ value: 'Event' }),
      ContentTextStub({ value: 'Type' }),
    ]);
  });

  it('VALID: {orchestration-event-type} => splits kebab-case on hyphens', () => {
    const result = identifierTokenizeTransformer({ identifier: 'orchestration-event-type' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'orchestration' }),
      ContentTextStub({ value: 'event' }),
      ContentTextStub({ value: 'type' }),
    ]);
  });

  it('VALID: {orchestration_event_type} => splits snake_case on underscores', () => {
    const result = identifierTokenizeTransformer({ identifier: 'orchestration_event_type' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'orchestration' }),
      ContentTextStub({ value: 'event' }),
      ContentTextStub({ value: 'type' }),
    ]);
  });

  it('VALID: {ORCHESTRATION_EVENT_TYPE} => splits SCREAMING_SNAKE_CASE on underscores', () => {
    const result = identifierTokenizeTransformer({ identifier: 'ORCHESTRATION_EVENT_TYPE' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'ORCHESTRATION' }),
      ContentTextStub({ value: 'EVENT' }),
      ContentTextStub({ value: 'TYPE' }),
    ]);
  });

  it('VALID: {URLParser} => splits caps-run + cap+lower as URL Parser', () => {
    const result = identifierTokenizeTransformer({ identifier: 'URLParser' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'URL' }),
      ContentTextStub({ value: 'Parser' }),
    ]);
  });

  it('VALID: {IOError} => splits two-letter caps run + cap+lower as IO Error', () => {
    const result = identifierTokenizeTransformer({ identifier: 'IOError' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'IO' }),
      ContentTextStub({ value: 'Error' }),
    ]);
  });

  it('VALID: {getURL} => splits trailing caps run from preceding lower as get URL', () => {
    const result = identifierTokenizeTransformer({ identifier: 'getURL' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'get' }),
      ContentTextStub({ value: 'URL' }),
    ]);
  });

  it('VALID: {version1Beta} => splits digit-to-upper boundary', () => {
    const result = identifierTokenizeTransformer({ identifier: 'version1Beta' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'version1' }),
      ContentTextStub({ value: 'Beta' }),
    ]);
  });

  it('VALID: {single} => single-token identifier returns one token', () => {
    const result = identifierTokenizeTransformer({ identifier: 'single' });

    expect(result).toStrictEqual([ContentTextStub({ value: 'single' })]);
  });

  it('VALID: {Single} => single PascalCase word returns one token', () => {
    const result = identifierTokenizeTransformer({ identifier: 'Single' });

    expect(result).toStrictEqual([ContentTextStub({ value: 'Single' })]);
  });

  it('VALID: {orchestration event type} => splits on whitespace', () => {
    const result = identifierTokenizeTransformer({ identifier: 'orchestration event type' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'orchestration' }),
      ContentTextStub({ value: 'event' }),
      ContentTextStub({ value: 'type' }),
    ]);
  });

  it('VALID: {mixed-case_With Spaces} => collapses all separator runs into single split', () => {
    const result = identifierTokenizeTransformer({ identifier: 'mixed-case_With Spaces' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'mixed' }),
      ContentTextStub({ value: 'case' }),
      ContentTextStub({ value: 'With' }),
      ContentTextStub({ value: 'Spaces' }),
    ]);
  });

  it('EMPTY: {empty string} => returns empty array', () => {
    const result = identifierTokenizeTransformer({ identifier: '' });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {only separators} => returns empty array', () => {
    const result = identifierTokenizeTransformer({ identifier: '---___   ' });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {leading and trailing separators} => trims and splits content', () => {
    const result = identifierTokenizeTransformer({ identifier: '-event-type-' });

    expect(result).toStrictEqual([
      ContentTextStub({ value: 'event' }),
      ContentTextStub({ value: 'type' }),
    ]);
  });
});
