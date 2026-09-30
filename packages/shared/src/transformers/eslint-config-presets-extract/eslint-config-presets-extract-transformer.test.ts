import { eslintConfigPresetsExtractTransformer } from './eslint-config-presets-extract-transformer';

describe('eslintConfigPresetsExtractTransformer', () => {
  describe('no configs block', () => {
    it('EMPTY: {source with no configs key} => returns empty array', () => {
      const result = eslintConfigPresetsExtractTransformer({
        source: 'export const foo = {}',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('configs block extraction', () => {
    it('VALID: {source with single preset} => returns one preset name', () => {
      const result = eslintConfigPresetsExtractTransformer({
        source: 'return { rules: {}, configs: { dungeonmaster: configDungeonmasterBroker() } };',
      });

      expect(result).toStrictEqual(['dungeonmaster']);
    });

    it('VALID: {source with two presets} => returns both preset names', () => {
      const result = eslintConfigPresetsExtractTransformer({
        source: 'return { rules: {}, configs: { dungeonmaster: configDungeonmasterBroker(), dungeonmasterTest: configDungeonmasterBroker({ forTesting: true }) } };',
      });

      expect(result).toStrictEqual([
        'dungeonmaster',
        'dungeonmasterTest',
      ]);
    });

    it('VALID: {source with quoted preset key} => returns preset name without quotes', () => {
      const result = eslintConfigPresetsExtractTransformer({
        source: "return { configs: { 'recommended': configBroker() } };",
      });

      expect(result).toStrictEqual(['recommended']);
    });
  });
});
