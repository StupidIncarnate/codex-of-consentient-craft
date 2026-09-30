import { routeMetadataExtractTransformer } from './route-metadata-extract-transformer';

describe('routeMetadataExtractTransformer', () => {
  describe('extracts paths and responders', () => {
    it('VALID: {single self-closing Route with path} => returns one metadata entry', () => {
      const source = `<Route path="/" element={<AppHomeResponder />} />`;
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: '/',
          responderSymbol: 'AppHomeResponder',
        },
      ]);
    });

    it('VALID: {multiple Routes with paths} => returns one entry per Route', () => {
      const source = [
          `<Route path="/:guildSlug/quest" element={<AppQuestChatResponder />} />`,
          `<Route path="/:guildSlug/quest/:questId" element={<AppQuestChatResponder />} />`,
        ].join('\n');
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: '/:guildSlug/quest',
          responderSymbol: 'AppQuestChatResponder',
        },
        {
          path: '/:guildSlug/quest/:questId',
          responderSymbol: 'AppQuestChatResponder',
        },
      ]);
    });

    it('VALID: {open Route without path - layout route} => returns metadata with path null', () => {
      const source = `<Route element={<AppLayoutResponder />}>`;
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: null,
          responderSymbol: 'AppLayoutResponder',
        },
      ]);
    });

    it('VALID: {layout Route plus child Route in same source} => returns both entries in order', () => {
      const source = [
          `<Routes>`,
          `  <Route element={<AppLayoutResponder />}>`,
          `    <Route path="/" element={<AppHomeResponder />} />`,
          `  </Route>`,
          `</Routes>`,
        ].join('\n');
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: null,
          responderSymbol: 'AppLayoutResponder',
        },
        {
          path: '/',
          responderSymbol: 'AppHomeResponder',
        },
      ]);
    });
  });

  describe('skips Routes without element', () => {
    it('VALID: {Route with only path attribute} => skips that Route', () => {
      const source = `<Route path="/orphan" />`;
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('strips comments before matching', () => {
    it('VALID: {JSDoc USAGE example contains <Route>} => only counts the actual JSX', () => {
      const source = [
          `/**`,
          ` * USAGE:`,
          ` * // Returns <Route path="/" element={<AppHomeResponder />} />`,
          ` */`,
          `<Route path="/" element={<AppHomeResponder />} />`,
        ].join('\n');
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: '/',
          responderSymbol: 'AppHomeResponder',
        },
      ]);
    });

    it('VALID: {single-line // comment with <Route>} => skips the comment', () => {
      const source = [
          `// <Route path="/disabled" element={<DisabledResponder />} />`,
          `<Route path="/active" element={<ActiveResponder />} />`,
        ].join('\n');
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: '/active',
          responderSymbol: 'ActiveResponder',
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {source with no Route JSX} => returns empty array', () => {
      const source = `export const NotAFlow = () => <div>hello</div>;`;
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty string source} => returns empty array', () => {
      const source = '';
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
