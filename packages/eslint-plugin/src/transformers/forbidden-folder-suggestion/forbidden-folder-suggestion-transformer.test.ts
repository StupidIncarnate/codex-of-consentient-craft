import { ForbiddenFolderNameStub } from '../../contracts/forbidden-folder-name/forbidden-folder-name.stub';
import { forbiddenFolderSuggestionTransformer } from './forbidden-folder-suggestion-transformer';

describe('forbiddenFolderSuggestionTransformer', () => {
  it('VALID: {forbiddenFolder: "utils"} => returns "adapters or transformers"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'utils' }),
    });

    expect(result).toBe('adapters or transformers');
  });

  it('VALID: {forbiddenFolder: "lib"} => returns "adapters"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'lib' }),
    });

    expect(result).toBe('adapters');
  });

  it('VALID: {forbiddenFolder: "helpers"} => returns "guards or transformers"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'helpers' }),
    });

    expect(result).toBe('guards or transformers');
  });

  it('VALID: {forbiddenFolder: "services"} => returns "brokers"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'services' }),
    });

    expect(result).toBe('brokers');
  });

  it('VALID: {forbiddenFolder: "types"} => returns "contracts"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'types' }),
    });

    expect(result).toBe('contracts');
  });

  it('VALID: {forbiddenFolder: "constants"} => returns "statics"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'constants' }),
    });

    expect(result).toBe('statics');
  });

  it('VALID: {forbiddenFolder: "formatters"} => returns "transformers"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'formatters' }),
    });

    expect(result).toBe('transformers');
  });

  it('VALID: {forbiddenFolder: "common"} => returns "distribute by function"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'common' }),
    });

    expect(result).toBe('distribute by function');
  });

  it('EDGE: {forbiddenFolder: "unknown-folder"} => returns "contracts"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: 'unknown-folder' }),
    });

    expect(result).toBe('contracts');
  });

  it('EDGE: {forbiddenFolder: ""} => returns "contracts"', () => {
    const result = forbiddenFolderSuggestionTransformer({
      forbiddenFolder: ForbiddenFolderNameStub({ value: '' }),
    });

    expect(result).toBe('contracts');
  });
});
