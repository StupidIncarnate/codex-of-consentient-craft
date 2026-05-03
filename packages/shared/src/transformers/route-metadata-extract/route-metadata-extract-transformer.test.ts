import { routeMetadataExtractTransformer } from './route-metadata-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('routeMetadataExtractTransformer', () => {
  describe('extracts paths and responders', () => {
    it('VALID: {single self-closing Route with path} => returns one metadata entry', () => {
      const source = ContentTextStub({
        value: `<Route path="/" element={<AppHomeResponder />} />`,
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: ContentTextStub({ value: '/' }),
          responderSymbol: ContentTextStub({ value: 'AppHomeResponder' }),
        },
      ]);
    });

    it('VALID: {multiple Routes with paths} => returns one entry per Route', () => {
      const source = ContentTextStub({
        value: [
          `<Route path="/:guildSlug/quest" element={<AppQuestChatResponder />} />`,
          `<Route path="/:guildSlug/quest/:questId" element={<AppQuestChatResponder />} />`,
        ].join('\n'),
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: ContentTextStub({ value: '/:guildSlug/quest' }),
          responderSymbol: ContentTextStub({ value: 'AppQuestChatResponder' }),
        },
        {
          path: ContentTextStub({ value: '/:guildSlug/quest/:questId' }),
          responderSymbol: ContentTextStub({ value: 'AppQuestChatResponder' }),
        },
      ]);
    });

    it('VALID: {open Route without path - layout route} => returns metadata with path null', () => {
      const source = ContentTextStub({
        value: `<Route element={<AppLayoutResponder />}>`,
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: null,
          responderSymbol: ContentTextStub({ value: 'AppLayoutResponder' }),
        },
      ]);
    });

    it('VALID: {layout Route plus child Route in same source} => returns both entries in order', () => {
      const source = ContentTextStub({
        value: [
          `<Routes>`,
          `  <Route element={<AppLayoutResponder />}>`,
          `    <Route path="/" element={<AppHomeResponder />} />`,
          `  </Route>`,
          `</Routes>`,
        ].join('\n'),
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: null,
          responderSymbol: ContentTextStub({ value: 'AppLayoutResponder' }),
        },
        {
          path: ContentTextStub({ value: '/' }),
          responderSymbol: ContentTextStub({ value: 'AppHomeResponder' }),
        },
      ]);
    });
  });

  describe('skips Routes without element', () => {
    it('VALID: {Route with only path attribute} => skips that Route', () => {
      const source = ContentTextStub({
        value: `<Route path="/orphan" />`,
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('strips comments before matching', () => {
    it('VALID: {JSDoc USAGE example contains <Route>} => only counts the actual JSX', () => {
      const source = ContentTextStub({
        value: [
          `/**`,
          ` * USAGE:`,
          ` * // Returns <Route path="/" element={<AppHomeResponder />} />`,
          ` */`,
          `<Route path="/" element={<AppHomeResponder />} />`,
        ].join('\n'),
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: ContentTextStub({ value: '/' }),
          responderSymbol: ContentTextStub({ value: 'AppHomeResponder' }),
        },
      ]);
    });

    it('VALID: {single-line // comment with <Route>} => skips the comment', () => {
      const source = ContentTextStub({
        value: [
          `// <Route path="/disabled" element={<DisabledResponder />} />`,
          `<Route path="/active" element={<ActiveResponder />} />`,
        ].join('\n'),
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          path: ContentTextStub({ value: '/active' }),
          responderSymbol: ContentTextStub({ value: 'ActiveResponder' }),
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {source with no Route JSX} => returns empty array', () => {
      const source = ContentTextStub({
        value: `export const NotAFlow = () => <div>hello</div>;`,
      });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty string source} => returns empty array', () => {
      const source = ContentTextStub({ value: '' });
      const result = routeMetadataExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
