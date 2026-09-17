/** The deployment's own public base URL, with no trailing slash. */
export function getAppUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}
