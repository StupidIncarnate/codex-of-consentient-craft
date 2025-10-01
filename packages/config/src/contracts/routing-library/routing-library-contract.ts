import { isInReadonlyArray } from '../is-in-readonly-array/is-in-readonly-array';

export const ALL_ROUTING_LIBRARIES = [
  // Frontend routers
  'react-router-dom',
  'vue-router',
  '@angular/router',

  // Backend frameworks (act as routers)
  'express',
  'fastify',
  'koa',
  'hapi',
] as const;

export type RoutingLibrary = (typeof ALL_ROUTING_LIBRARIES)[number];

export const isValidRoutingLibrary = (library: unknown): library is RoutingLibrary =>
  isInReadonlyArray({ value: library, array: ALL_ROUTING_LIBRARIES });
