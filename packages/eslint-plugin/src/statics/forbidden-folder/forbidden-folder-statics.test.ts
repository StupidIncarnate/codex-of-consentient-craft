import { forbiddenFolderStatics } from './forbidden-folder-statics';

describe('forbiddenFolderStatics', () => {
  describe('mappings', () => {
    it('VALID: utils maps to "adapters or transformers"', () => {
      expect(forbiddenFolderStatics.mappings.utils).toBe('adapters or transformers');
    });

    it('VALID: lib maps to "adapters"', () => {
      expect(forbiddenFolderStatics.mappings.lib).toBe('adapters');
    });

    it('VALID: helpers maps to "guards or transformers"', () => {
      expect(forbiddenFolderStatics.mappings.helpers).toBe('guards or transformers');
    });

    it('VALID: common maps to "distribute by function"', () => {
      expect(forbiddenFolderStatics.mappings.common).toBe('distribute by function');
    });

    it('VALID: shared maps to "distribute by function"', () => {
      expect(forbiddenFolderStatics.mappings.shared).toBe('distribute by function');
    });

    it('VALID: core maps to "brokers"', () => {
      expect(forbiddenFolderStatics.mappings.core).toBe('brokers');
    });

    it('VALID: services maps to "brokers"', () => {
      expect(forbiddenFolderStatics.mappings.services).toBe('brokers');
    });

    it('VALID: repositories maps to "brokers"', () => {
      expect(forbiddenFolderStatics.mappings.repositories).toBe('brokers');
    });

    it('VALID: models maps to "contracts"', () => {
      expect(forbiddenFolderStatics.mappings.models).toBe('contracts');
    });

    it('VALID: types maps to "contracts"', () => {
      expect(forbiddenFolderStatics.mappings.types).toBe('contracts');
    });

    it('VALID: interfaces maps to "contracts"', () => {
      expect(forbiddenFolderStatics.mappings.interfaces).toBe('contracts');
    });

    it('VALID: validators maps to "contracts"', () => {
      expect(forbiddenFolderStatics.mappings.validators).toBe('contracts');
    });

    it('VALID: constants maps to "statics"', () => {
      expect(forbiddenFolderStatics.mappings.constants).toBe('statics');
    });

    it('VALID: config maps to "statics"', () => {
      expect(forbiddenFolderStatics.mappings.config).toBe('statics');
    });

    it('VALID: enums maps to "statics"', () => {
      expect(forbiddenFolderStatics.mappings.enums).toBe('statics');
    });

    it('VALID: formatters maps to "transformers"', () => {
      expect(forbiddenFolderStatics.mappings.formatters).toBe('transformers');
    });

    it('VALID: mappers maps to "transformers"', () => {
      expect(forbiddenFolderStatics.mappings.mappers).toBe('transformers');
    });

    it('VALID: converters maps to "transformers"', () => {
      expect(forbiddenFolderStatics.mappings.converters).toBe('transformers');
    });

    it('VALID: contains all 19 forbidden folder mappings', () => {
      expect(Object.keys(forbiddenFolderStatics.mappings)).toHaveLength(19);
    });
  });

  describe('folders', () => {
    it('VALID: contains all forbidden folder names in correct order', () => {
      expect(forbiddenFolderStatics.folders).toStrictEqual([
        'utils',
        'lib',
        'helpers',
        'common',
        'shared',
        'core',
        'services',
        'repositories',
        'models',
        'types',
        'interfaces',
        'validators',
        'constants',
        'config',
        'enums',
        'formatters',
        'mappers',
        'converters',
      ]);
    });

    it('VALID: contains 19 forbidden folders', () => {
      expect(forbiddenFolderStatics.folders).toHaveLength(19);
    });

    it('VALID: folders array matches mappings keys', () => {
      const mappingKeys = Object.keys(forbiddenFolderStatics.mappings).sort();
      const foldersSorted = [...forbiddenFolderStatics.folders].sort();

      expect(foldersSorted).toStrictEqual(mappingKeys);
    });
  });
});
