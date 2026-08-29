import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f2] px-6 text-center">
      <div className="relative mb-6 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-3">
        <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
        <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
        <span className="text-lg">&#x2726;</span>
        <span className="font-lato text-[14px] font-bold tracking-[-0.42px] text-[#121212]">
          404
        </span>
      </div>

      <h1 className="mb-4 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
        Page not found
      </h1>

      <p className="mb-10 max-w-md text-[17px] leading-[1.7] tracking-[-0.34px] text-black/50">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <a
          href="/"
          className="inline-flex h-[46px] items-center gap-2 rounded-[36px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-8 text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-90"
        >
          Back to Home
          <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </a>
        <a
          href="/use-cases"
          className="inline-flex h-[46px] items-center gap-2 rounded-[36px] border border-black/10 bg-white px-8 text-[15px] font-medium text-[#121212] transition-colors hover:border-black/20"
        >
          Browse Use Cases
        </a>
      </div>

      <nav className="mt-16 flex items-center gap-6 font-tight text-[14px] text-black/40">
        <Link href="/use-cases" className="hover:text-[#121212] transition-colors">Use Cases</Link>
        <Link href="/glossary" className="hover:text-[#121212] transition-colors">Glossary</Link>
        <Link href="/compare" className="hover:text-[#121212] transition-colors">Compare</Link>
      </nav>
    </main>
  );
}
