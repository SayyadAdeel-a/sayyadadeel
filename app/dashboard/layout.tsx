import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen bg-[#f5f5f2]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[240px] flex-col border-r border-black/[0.06] bg-white">
        <div className="flex h-14 items-center border-b border-black/[0.06] px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg">&#x2726;</span>
            <span className="font-lato text-[14px] font-bold tracking-[-0.42px] text-[#121212]">
              CMS Dashboard
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="mb-4">
            <p className="mb-2 px-3 font-tight text-[11px] font-bold uppercase tracking-[0.5px] text-black/30">
              Content
            </p>
            <NavLink href="/dashboard" label="Overview" />
            <NavLink href="/dashboard/blog" label="Blog Posts" />
            <NavLink href="/dashboard/use-cases" label="Use Cases" />
            <NavLink href="/dashboard/glossary" label="Glossary" />
            <NavLink href="/dashboard/compare" label="Comparisons" />
          </div>

          <div className="mb-4">
            <p className="mb-2 px-3 font-tight text-[11px] font-bold uppercase tracking-[0.5px] text-black/30">
              Links
            </p>
            <NavLink href="/dashboard/links" label="Manage Links" />
          </div>

          <div>
            <p className="mb-2 px-3 font-tight text-[11px] font-bold uppercase tracking-[0.5px] text-black/30">
              Site
            </p>
            <NavLink href="/dashboard/settings" label="Settings" />
          </div>
        </nav>

        <div className="border-t border-black/[0.06] px-3 py-3">
          <div className="flex items-center justify-between">
            <a
              href="/"
              target="_blank"
              className="font-tight text-[13px] text-black/40 hover:text-[#121212]"
            >
              View Site ↗
            </a>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="font-tight text-[13px] text-black/40 hover:text-red-500"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[240px] flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-9 items-center rounded-[8px] px-3 font-tight text-[14px] text-black/50 transition-colors hover:bg-black/[0.03] hover:text-[#121212]"
    >
      {label}
    </Link>
  );
}
