"use client";

import { useState } from "react";

interface LinkItem {
  label: string;
  href: string;
}

const LINK_SECTIONS = [
  { key: "footer", label: "Footer Links", description: "Main navigation links in the footer" },
  { key: "seo", label: "SEO Hub Links", description: "Links to Use Cases, Glossary, Compare hubs" },
  { key: "nav", label: "SEO Page Nav Links", description: "Navigation links shown on SEO pages" },
] as const;

const DEFAULT_LINKS: Record<string, LinkItem[]> = {
  footer: [
    { label: "FieldOS", href: "https://fieldos.adeelsayyad.tech" },
    { label: "App", href: "https://app.adeelsayyad.tech" },
    { label: "GitHub", href: "https://github.com/adeelsayyad" },
  ],
  seo: [
    { label: "Blog", href: "/blog" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Glossary", href: "/glossary" },
    { label: "Compare", href: "/compare" },
  ],
  nav: [
    { label: "Blog", href: "/blog" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Glossary", href: "/glossary" },
    { label: "Compare", href: "/compare" },
  ],
};

export default function LinksManager() {
  const [links, setLinks] = useState<Record<string, LinkItem[]>>(DEFAULT_LINKS);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<LinkItem[]>([]);
  const [message, setMessage] = useState("");

  const startEdit = (key: string) => {
    setEditing(key);
    setDraft([...(links[key] || [])]);
  };

  const saveDraft = () => {
    if (!editing) return;
    setLinks((prev) => ({ ...prev, [editing]: draft }));
    setEditing(null);
    setMessage("Links updated! Changes will appear after saving via the API.");
    setTimeout(() => setMessage(""), 3000);
  };

  const addLink = () => {
    setDraft((prev) => [...prev, { label: "", href: "" }]);
  };

  const removeLink = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    setDraft((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-instrument-serif text-[28px] tracking-[-0.84px] text-[#121212]">Manage Links</h1>
        <p className="font-tight text-[14px] text-black/40">Edit navigation and footer links across your site.</p>
      </div>

      {message && (
        <div className="mb-6 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-700">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {LINK_SECTIONS.map((section) => (
          <div key={section.key} className="rounded-[16px] border border-black/[0.06] bg-white p-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-tight text-[15px] font-medium text-[#121212]">{section.label}</h2>
              <button
                onClick={() => editing === section.key ? setEditing(null) : startEdit(section.key)}
                className="font-tight text-[13px] text-black/40 hover:text-[#121212]"
              >
                {editing === section.key ? "Cancel" : "Edit"}
              </button>
            </div>
            <p className="mb-4 font-tight text-[13px] text-black/40">{section.description}</p>

            {editing === section.key ? (
              <div className="flex flex-col gap-3">
                {draft.map((link, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(i, "label", e.target.value)}
                      placeholder="Label"
                      className="h-[36px] flex-1 rounded-[8px] border border-black/10 bg-[#f5f5f2] px-3 font-tight text-[13px] text-[#121212] outline-none focus:border-black/30"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => updateLink(i, "href", e.target.value)}
                      placeholder="URL or path"
                      className="h-[36px] flex-[2] rounded-[8px] border border-black/10 bg-[#f5f5f2] px-3 font-mono text-[13px] text-[#121212] outline-none focus:border-black/30"
                    />
                    <button onClick={() => removeLink(i)} className="size-[36px] shrink-0 rounded-[8px] border border-black/10 text-[14px] text-black/30 transition-colors hover:border-red-200 hover:text-red-500">
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button onClick={addLink} className="h-[36px] rounded-[8px] border border-dashed border-black/10 px-4 font-tight text-[13px] text-black/40 transition-colors hover:border-black/20 hover:text-[#121212]">
                    + Add Link
                  </button>
                  <button onClick={saveDraft} className="h-[36px] rounded-[8px] border border-black bg-[#121212] px-4 text-[13px] font-medium text-white hover:opacity-90">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {(links[section.key] || []).map((link, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-[8px] px-3 py-2">
                    <span className="font-tight text-[14px] text-[#121212]">{link.label}</span>
                    <span className="font-mono text-[12px] text-black/30">{link.href}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
