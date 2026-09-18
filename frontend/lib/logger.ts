/* Central logger — verbose in development, silent in production builds so the
   shipped console stays clean (structured reporting can be wired in later). */
/* eslint-disable no-console */
const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  error: (...args: unknown[]): void => {
    if (!isProd) console.error(...args);
  },
  warn: (...args: unknown[]): void => {
    if (!isProd) console.warn(...args);
  }
};
