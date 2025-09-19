import * as Sentry from '@sentry/nextjs';

export function register() {
  // This file configures the initialization of Sentry on the server.
  // The config you add here will be used whenever the server handles a request.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/

  // This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
  // The config you add here will be used whenever one of the edge features is loaded.
  // Note that edge features do not support Session Replay.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for finer control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
