// Extend Error constructor to support ES2022 cause option
interface ErrorOptions {
  cause?: unknown;
}

interface ErrorConstructor {
  (message?: string, options?: ErrorOptions): Error;
  new (message?: string, options?: ErrorOptions): Error;
}
