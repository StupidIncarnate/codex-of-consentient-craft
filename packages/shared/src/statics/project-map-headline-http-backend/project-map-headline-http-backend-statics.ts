/**
 * PURPOSE: Configuration constants for the http-backend headline renderer
 *
 * USAGE:
 * projectMapHeadlineHttpBackendStatics.methodPadWidth; // 6
 *
 * WHEN-TO-USE: project-map-headline-http-backend broker and its layer brokers
 */

export const projectMapHeadlineHttpBackendStatics = {
  methodPadWidth: 6,
  minUrlSegmentsForNonTrivial: 2,
  routesSectionHeader: '## Routes — every server endpoint',
  routesSectionDescription:
    'Exhaustive: every HTTP route the server registers is listed below. Each section header names the flow file where the routes are registered via `app.<method>(...)`.',
  routesSectionEmpty: '(no routes found in this package)',
} as const;
