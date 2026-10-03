/**
 * The only place a GitHub credential exists.
 *
 * The token is read from `GITHUB_TOKEN` and used here, server-side, to write
 * files through the Contents API. It is never returned to the browser, never
 * logged, and never embedded in a URL. `GITHUB_REPO` and `GITHUB_BRANCH` decide
 * which repository and branch are written.
 *
 * Why the Contents API rather than the Git data API: a Contents commit is one
 * atomic commit containing every changed file, which is exactly the unit Vercel
 * watches. It also gives a per-file SHA to pass as `base64`-encoded `sha` for
 * safe updates, so a concurrent commit cannot silently overwrite someone's work
 * — the write fails with 409 instead.
 */

const API = "https://api.github.com";

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
}

/** Read and validate the repository configuration from the environment. */
export function repoConfig(): RepoConfig | null {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!owner || !repo) return null;
  return { owner, repo, branch };
}

export function isConfigured(): boolean {
  return Boolean(repoConfig() && process.env.GITHUB_TOKEN);
}

interface ContentsFile {
  sha: string;
  content: string;
  encoding: string;
}

async function githubFetch<T>(
  path: string,
  init: RequestInit & { token: string }
): Promise<T> {
  const response = await fetch(API + path, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + init.token,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    // The body can contain the token in an error echo, so it is truncated and
    // never passed through verbatim to logs.
    throw new GitHubError(
      response.status,
      "GitHub responded " + response.status + " " + response.statusText,
      body.slice(0, 300)
    );
  }
  return (await response.json()) as T;
}

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail: string
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/** Fetch one file's current content and SHA, or null when it does not exist. */
export async function getFile(
  config: RepoConfig,
  token: string,
  path: string
): Promise<ContentsFile | null> {
  try {
    const file = await githubFetch<ContentsFile>(
      "/repos/" +
        config.owner +
        "/" +
        config.repo +
        "/contents/" +
        encodeURIComponent(path) +
        "?ref=" +
        encodeURIComponent(config.branch),
      { token }
    );
    return {
      sha: file.sha,
      // GitHub returns base64 with newlines when contents is long.
      content: file.content.replace(/\n/g, ""),
      encoding: file.encoding,
    };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }
}

export function decodeContent(file: ContentsFile): string {
  if (file.encoding === "base64") {
    return Buffer.from(file.content, "base64").toString("utf8");
  }
  return file.content;
}

export interface CommitFile {
  path: string;
  content: string;
}

export interface CommitOutcome {
  commitSha: string;
  commitUrl: string;
}

/**
 * Create a single commit containing every file.
 *
 * All-or-nothing: if any file cannot be written the whole call fails and
 * nothing is committed, so a half-applied save is not possible.
 */
export async function commitFiles(
  config: RepoConfig,
  token: string,
  files: CommitFile[],
  message: string
): Promise<CommitOutcome> {
  if (files.length === 0) {
    throw new Error("Nothing to commit.");
  }

  type TreeEntry = {
    path: string;
    mode: "100644";
    type: "blob";
    sha?: string;
    content?: string;
  };
  const tree: TreeEntry[] = [];

  for (const file of files) {
    const existing = await getFile(config, token, file.path);
    tree.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      // Passing `sha` makes GitHub verify the file has not changed since it was
      // read. Omitting `content` means "keep what is already there".
      ...(existing ? { sha: existing.sha } : { content: file.content }),
    });
  }

  const baseRef = await githubFetch<{ object: { sha: string } }>(
    "/repos/" + config.owner + "/" + config.repo + "/git/ref/heads/" + encodeURIComponent(config.branch),
    { token }
  );

  const createdTree = await githubFetch<{ sha: string }>(
    "/repos/" + config.owner + "/" + config.repo + "/git/trees",
    {
      token,
      method: "POST",
      body: JSON.stringify({ base_tree: baseRef.object.sha, tree }),
    }
  );

  const commit = await githubFetch<{ sha: string; html_url: string }>(
    "/repos/" + config.owner + "/" + config.repo + "/git/commits",
    {
      token,
      method: "POST",
      body: JSON.stringify({
        message,
        tree: createdTree.sha,
        parents: [baseRef.object.sha],
      }),
    }
  );

  await githubFetch<{ sha: string }>(
    "/repos/" +
      config.owner +
      "/" +
      config.repo +
      "/git/refs/heads/" +
      encodeURIComponent(config.branch),
    {
      token,
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    }
  );

  return { commitSha: commit.sha, commitUrl: commit.html_url };
}

/** Upload a binary asset (an image the user picked) to the repository. */
export async function commitBinary(
  config: RepoConfig,
  token: string,
  path: string,
  bytes: Uint8Array,
  message: string
): Promise<CommitOutcome> {
  const base64 = Buffer.from(bytes).toString("base64");
  return commitFiles(config, token, [{ path, content: base64 }], message);
}
