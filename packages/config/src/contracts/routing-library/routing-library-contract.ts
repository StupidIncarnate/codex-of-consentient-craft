export type RoutingLibrary =
  | 'react-router-dom'
  | 'vue-router'
  | '@angular/router' // Frontend routers
  | 'express'
  | 'fastify'
  | 'koa'
  | 'hapi'; // Backend frameworks (act as routers)

export const ALL_ROUTING_LIBRARIES: readonly RoutingLibrary[] = [
  'react-router-dom',
  'vue-router',
  '@angular/router',
  'express',
  'fastify',
  'koa',
  'hapi',
] as const;

export const isValidRoutingLibrary = (library: unknown): library is RoutingLibrary =>
  typeof library === 'string' && ALL_ROUTING_LIBRARIES.includes(library as RoutingLibrary);
