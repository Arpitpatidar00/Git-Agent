import { Octokit } from "@octokit/rest";

/**
 * Creates an authenticated Octokit instance for GitHub API calls.
 * Each call should create a fresh instance with the user's token.
 */
export function createOctokitClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
    userAgent: "github-automation-bot/1.0",
  });
}
