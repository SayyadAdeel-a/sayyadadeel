"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ContentEditor, type FieldConfig } from "@/components/cms/content-editor";

const COMPARE_FIELDS: FieldConfig[] = [
  { key: "slug", label: "URL Slug", type: "slug", required: true },
  { key: "title", label: "Title", type: "text", required: true },
  { key: "h1", label: "H1 Heading", type: "text", required: true },
  { key: "metaTitle", label: "Meta Title", type: "text" },
  { key: "metaDescription", label: "Meta Description", type: "textarea" },
  { key: "intro", label: "Introduction", type: "textarea" },
  { key: "verdict", label: "Verdict", type: "textarea" },
  { key: "cta", label: "CTA Button Text", type: "text" },
];

interface Comparison {
  slug: string;
  title: string;
  [key: string]: any;
}

export default function CompareManager() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const [items, setItems] = useState<Comparison[]>([]);
  const [selected, setSelected] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => {
    if (editSlug && items.length) { const item = items.find((i) => i.slug === editSlug); if (item) setSelected(item); }
  }, [editSlug, items]);
  useEffect(() => { if (isNew) setSelected(null); }, [isNew]);

  const fetchItems = async () => {
    const res = await fetch("/api/cms?type=comparisons");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    const method = selected ? "PUT" : "POST";
    const res = await fetch("/api/cms", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "comparisons", slug: selected?.slug, data }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    await fetchItems();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await fetch(`/api/cms?type=comparisons&slug=${selected.slug}`, { method: "DELETE" });
    setSelected(null);
    await fetchItems();
  };

  const updateComparison = async (comparison: any) => {
    if (!selected) return;
    const res = await fetch("/api/cms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "comparisons", slug: selected.slug, data: { comparison } }),
    });
    if (res.ok) { setSelected({ ...selected, comparison }); await fetchItems(); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-instrument-serif text-[28px] tracking-[-0.84px] text-[#121212]">Comparisons</h1>
          <p className="font-tight text-[14px] text-black/40">{items.length} comparisons</p>
        </div>
        <button onClick={() => setSelected(null)} className="h-[38px] rounded-[10px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
          + New Comparison
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-1 rounded-[16px] border border-black/[0.06] bg-white p-3">
          {loading ? <p className="px-3 py-4 text-[13px] text-black/30">Loading...</p> : items.length === 0 ? <p className="px-3 py-4 text-[13px] text-black/30">No comparisons yet</p> : (
            items.map((item) => (
              <button key={item.slug} onClick={() => setSelected(item)} className={`flex flex-col items-start rounded-[8px] px-3 py-2.5 text-left transition-colors ${selected?.slug === item.slug ? "bg-black/[0.05]" : "hover:bg-black/[0.02]"}`}>
                <span className="font-tight text-[13px] text-[#121212] line-clamp-1">{item.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
            <ContentEditor type="comparisons" item={selected} onSave={handleSave} onDelete={selected ? handleDelete : undefined} fields={COMPARE_FIELDS} />
          </div>
          {selected?.comparison && (
            <ComparisonEditor comparison={selected.comparison} onUpdate={updateComparison} />
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonEditor({ comparison, onUpdate }: { comparison: any; onUpdate: (c: any) => void }) {
  const [draft, setDraft] = useState(JSON.stringify(comparison, null, 2));
  const [editing, setEditing] = useState(false);

  const save = () => {
    try {
      onUpdate(JSON.parse(draft));
      setEditing(false);
    } catch { alert("Invalid JSON"); }
  };

  return (
    <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">Comparison Data</h3>
        <button onClick={() => { setDraft(JSON.stringify(comparison, null, 2)); setEditing(!editing); }} className="font-tight text-[13px] text-black/40 hover:text-[#121212]">{editing ? "Cancel" : "Edit JSON"}</button>
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={20} className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-3 font-mono text-[12px] leading-[1.5] text-[#121212] outline-none focus:border-black/30 resize-y" />
          <button onClick={save} className="h-[36px] self-start rounded-[8px] border border-black bg-[#121212] px-4 text-[13px] font-medium text-white hover:opacity-90">Save JSON</button>
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-[8px] bg-[#f5f5f2] p-4 font-mono text-[12px] leading-[1.5] text-black/60">
          {JSON.stringify(comparison, null, 2)}
        </pre>
      )}
    </div>
  );
}
