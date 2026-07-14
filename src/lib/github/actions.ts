import { Octokit } from "@octokit/rest";

/**
 * Adds a label to an issue or pull request.
 * Tier 2: I/O wrapper — thin layer over Octokit.
 */
export async function addLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  label: string
): Promise<void> {
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: [label],
  });
}

/**
 * Posts a comment on an issue or pull request.
 * Tier 2: I/O wrapper — thin layer over Octokit.
 */
export async function postComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}
