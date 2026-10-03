import { ROUTES, editorUrl } from "@/generated/admin-registry";
import LogoutButton from "@/components/admin/LogoutButton";
import { isConfigured, repoConfig } from "@/lib/admin/github";

/**
 * The page list.
 *
 * Every route the site serves, each linking to its editor. The list is generated
 * from the site's own page modules, so a page added later shows up here without
 * anyone remembering to update the editor.
 *
 * The publish-readiness notice is deliberately up front rather than discovered
 * on the first Save: a deployment missing `GITHUB_TOKEN` looks perfectly
 * functional until the moment it matters, and finding out then — after editing —
 * is the worst time.
 */
export default function AdminDashboard() {
  const repo = repoConfig();
  const ready = isConfigured();

  return (
    <main className="adm-dash">
      <div className="adm-dash-head">
        <div>
          <h1>Pages</h1>
          <p className="adm-dash-sub">
            Click a page to edit its text, images and links in place. Changes are
            previewed live, then published to{" "}
            {repo ? (
              <strong>
                {repo.owner}/{repo.repo}
              </strong>
            ) : (
              "GitHub"
            )}{" "}
            when you save — Vercel rebuilds the site from the commit.
          </p>
        </div>
        <LogoutButton />
      </div>

      {!ready && (
        <p className="adm-dash-warn">
          <strong>Publishing is not configured.</strong> Set{" "}
          <code>GITHUB_TOKEN</code>, <code>GITHUB_REPO_OWNER</code> and{" "}
          <code>GITHUB_REPO_NAME</code> in the deployment environment. You can
          still browse and edit, but Save will report an error until they are set.
        </p>
      )}

      <ul className="adm-grid">
        {ROUTES.map((route) => (
          <li key={route.route}>
            <a className="adm-card" href={editorUrl(route.route)}>
              <span className="adm-card-name">{route.label}</span>
              <span className="adm-card-path">{editorUrl(route.route)}</span>
              <span className="adm-card-files">
                {route.files.length} {route.files.length === 1 ? "file" : "files"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}