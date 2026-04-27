import { matchPath } from 'react-router-dom';

import { AppQuestChatResponder } from '../../responders/app/quest-chat/app-quest-chat-responder';
import { QuestChatFlow } from './quest-chat-flow';

describe('QuestChatFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports QuestChatFlow function', () => {
      expect(QuestChatFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('route elements', () => {
    it('VALID: {QuestChatFlow()} => returns Routes for /:guildSlug/quest, /:guildSlug/quest/:questId, /:guildSlug/session, /:guildSlug/session/:sessionId all mounting AppQuestChatResponder', () => {
      const [questNoId, questWithId, sessionNoId, sessionWithId] = QuestChatFlow().props
        .children as [React.JSX.Element, React.JSX.Element, React.JSX.Element, React.JSX.Element];

      expect([
        { path: questNoId.props.path, elementType: questNoId.props.element.type },
        { path: questWithId.props.path, elementType: questWithId.props.element.type },
        { path: sessionNoId.props.path, elementType: sessionNoId.props.element.type },
        { path: sessionWithId.props.path, elementType: sessionWithId.props.element.type },
      ]).toStrictEqual([
        { path: '/:guildSlug/quest', elementType: AppQuestChatResponder },
        { path: '/:guildSlug/quest/:questId', elementType: AppQuestChatResponder },
        { path: '/:guildSlug/session', elementType: AppQuestChatResponder },
        { path: '/:guildSlug/session/:sessionId', elementType: AppQuestChatResponder },
      ]);
    });
  });

  describe('route matching', () => {
    it('VALID: {/myguild/quest against /:guildSlug/quest pattern} => matches with parsed guildSlug and no questId', () => {
      const [questNoId] = QuestChatFlow().props.children as [React.JSX.Element];
      const pattern = String(questNoId.props.path);

      const match = matchPath(pattern, '/myguild/quest');

      expect({
        guildSlug: match?.params.guildSlug,
        questId: match?.params.questId,
      }).toStrictEqual({
        guildSlug: 'myguild',
        questId: undefined,
      });
    });

    it('VALID: {/myguild/quest/abc-123 against /:guildSlug/quest/:questId pattern} => matches with parsed guildSlug and questId', () => {
      const [, questWithId] = QuestChatFlow().props.children as [
        React.JSX.Element,
        React.JSX.Element,
      ];
      const pattern = String(questWithId.props.path);

      const match = matchPath(pattern, '/myguild/quest/abc-123');

      expect({
        guildSlug: match?.params.guildSlug,
        questId: match?.params.questId,
      }).toStrictEqual({
        guildSlug: 'myguild',
        questId: 'abc-123',
      });
    });

    it('VALID: {/myguild/session against /:guildSlug/session pattern} => matches the legacy session route with no sessionId', () => {
      const [, , sessionNoId] = QuestChatFlow().props.children as [
        React.JSX.Element,
        React.JSX.Element,
        React.JSX.Element,
      ];
      const pattern = String(sessionNoId.props.path);

      const match = matchPath(pattern, '/myguild/session');

      expect({
        guildSlug: match?.params.guildSlug,
        sessionId: match?.params.sessionId,
      }).toStrictEqual({
        guildSlug: 'myguild',
        sessionId: undefined,
      });
    });

    it('VALID: {/myguild/session/abc-123 against /:guildSlug/session/:sessionId pattern} => matches the legacy session route with parsed sessionId', () => {
      const [, , , sessionWithId] = QuestChatFlow().props.children as [
        React.JSX.Element,
        React.JSX.Element,
        React.JSX.Element,
        React.JSX.Element,
      ];
      const pattern = String(sessionWithId.props.path);

      const match = matchPath(pattern, '/myguild/session/abc-123');

      expect({
        guildSlug: match?.params.guildSlug,
        sessionId: match?.params.sessionId,
      }).toStrictEqual({
        guildSlug: 'myguild',
        sessionId: 'abc-123',
      });
    });

    it('EDGE: {/myguild/quest/abc-123/extra against /:guildSlug/quest/:questId pattern} => does NOT match because the misnamed legacy /quest/:sessionId/extra route was removed in Stage 4', () => {
      const [, questWithId] = QuestChatFlow().props.children as [
        React.JSX.Element,
        React.JSX.Element,
      ];
      const pattern = String(questWithId.props.path);

      const match = matchPath(pattern, '/myguild/quest/abc-123/extra');

      expect(match).toBe(null);
    });

    it('EDGE: {/ against /:guildSlug/quest pattern} => does NOT match the root', () => {
      const [questNoId] = QuestChatFlow().props.children as [React.JSX.Element];
      const pattern = String(questNoId.props.path);

      const match = matchPath(pattern, '/');

      expect(match).toBe(null);
    });
  });
});
