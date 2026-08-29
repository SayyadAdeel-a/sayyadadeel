"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ContentEditor, type FieldConfig } from "@/components/cms/content-editor";

const GLOSSARY_FIELDS: FieldConfig[] = [
  { key: "slug", label: "URL Slug", type: "slug", required: true },
  { key: "title", label: "Title", type: "text", required: true },
  { key: "h1", label: "H1 Heading", type: "text", required: true },
  { key: "metaTitle", label: "Meta Title", type: "text" },
  { key: "metaDescription", label: "Meta Description", type: "textarea" },
  { key: "definition", label: "Definition", type: "textarea" },
  { key: "whyItMatters", label: "Why It Matters", type: "textarea" },
  { key: "howFieldOSHelps", label: "How FieldOS Helps", type: "textarea" },
];

interface GlossaryItem {
  slug: string;
  title: string;
  [key: string]: any;
}

export default function GlossaryManager() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [selected, setSelected] = useState<GlossaryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => {
    if (editSlug && items.length) {
      const item = items.find((i) => i.slug === editSlug);
      if (item) setSelected(item);
    }
  }, [editSlug, items]);
  useEffect(() => { if (isNew) setSelected(null); }, [isNew]);

  const fetchItems = async () => {
    const res = await fetch("/api/cms?type=glossary");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    const method = selected ? "PUT" : "POST";
    const res = await fetch("/api/cms", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "glossary", slug: selected?.slug, data }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    await fetchItems();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await fetch(`/api/cms?type=glossary&slug=${selected.slug}`, { method: "DELETE" });
    setSelected(null);
    await fetchItems();
  };

  const updateArrayField = async (field: string, value: string[]) => {
    if (!selected) return;
    const res = await fetch("/api/cms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "glossary", slug: selected.slug, data: { [field]: value } }),
    });
    if (res.ok) { setSelected({ ...selected, [field]: value }); await fetchItems(); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-instrument-serif text-[28px] tracking-[-0.84px] text-[#121212]">Glossary</h1>
          <p className="font-tight text-[14px] text-black/40">{items.length} terms</p>
        </div>
        <button onClick={() => setSelected(null)} className="h-[38px] rounded-[10px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
          + New Term
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-1 rounded-[16px] border border-black/[0.06] bg-white p-3">
          {loading ? <p className="px-3 py-4 text-[13px] text-black/30">Loading...</p> : items.length === 0 ? <p className="px-3 py-4 text-[13px] text-black/30">No terms yet</p> : (
            items.map((item) => (
              <button key={item.slug} onClick={() => setSelected(item)} className={`flex flex-col items-start rounded-[8px] px-3 py-2.5 text-left transition-colors ${selected?.slug === item.slug ? "bg-black/[0.05]" : "hover:bg-black/[0.02]"}`}>
                <span className="font-tight text-[13px] text-[#121212] line-clamp-1">{item.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
            <ContentEditor type="glossary" item={selected} onSave={handleSave} onDelete={selected ? handleDelete : undefined} fields={GLOSSARY_FIELDS} />
          </div>
          {selected && (
            <ArrayFieldEditor label="What It Involves" items={selected.whatItInvolves || []} onUpdate={(v) => updateArrayField("whatItInvolves", v)} />
          )}
        </div>
      </div>
    </div>
  );
}

function ArrayFieldEditor({ label, items, onUpdate }: { label: string; items: string[]; onUpdate: (v: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(items.join("\n"));
  const save = () => { onUpdate(draft.split("\n").map((l) => l.trim()).filter(Boolean)); setEditing(false); };
  return (
    <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">{label}</h3>
        <button onClick={() => { setDraft(items.join("\n")); setEditing(!editing); }} className="font-tight text-[13px] text-black/40 hover:text-[#121212]">{editing ? "Cancel" : "Edit"}</button>
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={Math.max(4, items.length + 1)} className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-3 font-tight text-[13px] leading-[1.6] text-[#121212] outline-none focus:border-black/30 resize-y" placeholder="One item per line" />
          <button onClick={save} className="h-[36px] self-start rounded-[8px] border border-black bg-[#121212] px-4 text-[13px] font-medium text-white hover:opacity-90">Save</button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item, i) => (<li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-black/60"><span className="mt-1.5 size-[5px] shrink-0 rounded-full bg-[#c8ff00]" />{item}</li>))}
        </ul>
      )}
    </div>
  );
}
