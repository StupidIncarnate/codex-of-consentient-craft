import { projectMapHeadlineHttpBackendStatics } from './project-map-headline-http-backend-statics';

describe('projectMapHeadlineHttpBackendStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineHttpBackendStatics).toStrictEqual({
      methodPadWidth: 6,
      minUrlSegmentsForNonTrivial: 2,
      routesSectionHeader: '## Routes — every server endpoint',
      routesSectionDescription:
        'Exhaustive: every HTTP route the server registers is listed below. Each section header names the flow file where the routes are registered via `app.<method>(...)`.',
      routesSectionEmpty: '(no routes found in this package)',
    });
  });
});
