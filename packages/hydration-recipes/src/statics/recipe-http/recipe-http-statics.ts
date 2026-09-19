/**
 * PURPOSE: The HTTP knobs every recipe that calls a lane's real API shares — the method names, the
 * routes those recipes write through, and how much of a refused response body an error carries.
 * Reach for this over retyping `'POST'` or `'/api/quests'` inside a recipe: a route typed twice is
 * a route that can be wrong in one place, and these are the app's OWN writers, which is the entire
 * claim `fidelity: production` makes.
 *
 * `limits.errorBodyChars` exists because a refused write's body can be a whole stack trace, and an
 * error that pastes one buries the status and the route a reader is actually looking for.
 *
 * USAGE:
 * recipeHttpStatics.routes.guilds;
 * // Returns '/api/guilds'
 */

export const recipeHttpStatics = {
  methods: {
    get: 'GET',
    post: 'POST',
    patch: 'PATCH',
  },
  routes: {
    guilds: '/api/guilds',
    quests: '/api/quests',
  },
  limits: {
    errorBodyChars: 500,
  },
} as const;
