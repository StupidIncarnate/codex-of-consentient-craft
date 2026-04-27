import { matchPath } from 'react-router-dom';

import { AppSessionViewResponder } from '../../responders/app/session-view/app-session-view-responder';
import { SessionViewFlow } from './session-view-flow';

describe('SessionViewFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports SessionViewFlow function', () => {
      expect(SessionViewFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('route element', () => {
    it('VALID: {SessionViewFlow()} => returns a Route configured for /:guildSlug/session/:sessionId mounting AppSessionViewResponder', () => {
      const routeElement = SessionViewFlow();

      expect({
        path: routeElement.props.path,
        elementType: routeElement.props.element.type,
      }).toStrictEqual({
        path: '/:guildSlug/session/:sessionId',
        elementType: AppSessionViewResponder,
      });
    });
  });

  describe('route matching', () => {
    it('VALID: {/myguild/session/abc-123 against /:guildSlug/session/:sessionId pattern} => matches with parsed params', () => {
      const routeElement = SessionViewFlow();
      const pattern = String(routeElement.props.path);

      const match = matchPath(pattern, '/myguild/session/abc-123');

      expect({
        guildSlug: match?.params.guildSlug,
        sessionId: match?.params.sessionId,
      }).toStrictEqual({
        guildSlug: 'myguild',
        sessionId: 'abc-123',
      });
    });

    it('EDGE: {/myguild/quest/abc-123 against /:guildSlug/session/:sessionId pattern} => does NOT match the session route', () => {
      const routeElement = SessionViewFlow();
      const pattern = String(routeElement.props.path);

      const match = matchPath(pattern, '/myguild/quest/abc-123');

      expect(match).toBe(null);
    });

    it('EDGE: {/myguild/session against /:guildSlug/session/:sessionId pattern} => does NOT match without sessionId', () => {
      const routeElement = SessionViewFlow();
      const pattern = String(routeElement.props.path);

      const match = matchPath(pattern, '/myguild/session');

      expect(match).toBe(null);
    });

    it('EDGE: {/ against /:guildSlug/session/:sessionId pattern} => does NOT match the root', () => {
      const routeElement = SessionViewFlow();
      const pattern = String(routeElement.props.path);

      const match = matchPath(pattern, '/');

      expect(match).toBe(null);
    });
  });
});
