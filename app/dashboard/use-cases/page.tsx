"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ContentEditor, type FieldConfig } from "@/components/cms/content-editor";

const USE_CASE_FIELDS: FieldConfig[] = [
  { key: "slug", label: "URL Slug", type: "slug", required: true },
  { key: "title", label: "Title", type: "text", required: true },
  { key: "h1", label: "H1 Heading", type: "text", required: true },
  { key: "metaTitle", label: "Meta Title", type: "text" },
  { key: "metaDescription", label: "Meta Description", type: "textarea" },
  { key: "intro", label: "Introduction", type: "textarea" },
  { key: "useCase", label: "Use Case (in practice)", type: "textarea" },
  { key: "cta", label: "CTA Button Text", type: "text" },
];

interface UseCase {
  slug: string;
  title: string;
  [key: string]: any;
}

export default function UseCasesManager() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const [items, setItems] = useState<UseCase[]>([]);
  const [selected, setSelected] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => {
    if (editSlug && items.length) {
      const item = items.find((i) => i.slug === editSlug);
      if (item) setSelected(item);
    }
  }, [editSlug, items]);
  useEffect(() => { if (isNew) setSelected(null); }, [isNew]);

  const fetchItems = async () => {
    const res = await fetch("/api/cms?type=use-cases");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    const method = selected ? "PUT" : "POST";
    const res = await fetch("/api/cms", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "use-cases", slug: selected?.slug, data }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    await fetchItems();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await fetch(`/api/cms?type=use-cases&slug=${selected.slug}`, { method: "DELETE" });
    setSelected(null);
    await fetchItems();
  };

  const updateArrayField = async (field: string, value: string[]) => {
    if (!selected) return;
    const res = await fetch("/api/cms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "use-cases", slug: selected.slug, data: { [field]: value } }),
    });
    if (res.ok) {
      setSelected({ ...selected, [field]: value });
      await fetchItems();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-instrument-serif text-[28px] tracking-[-0.84px] text-[#121212]">Use Cases</h1>
          <p className="font-tight text-[14px] text-black/40">{items.length} use cases</p>
        </div>
        <button onClick={() => setSelected(null)} className="h-[38px] rounded-[10px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
          + New Use Case
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-1 rounded-[16px] border border-black/[0.06] bg-white p-3">
          {loading ? (
            <p className="px-3 py-4 text-[13px] text-black/30">Loading...</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-black/30">No use cases yet</p>
          ) : (
            items.map((item) => (
              <button key={item.slug} onClick={() => setSelected(item)} className={`flex flex-col items-start rounded-[8px] px-3 py-2.5 text-left transition-colors ${selected?.slug === item.slug ? "bg-black/[0.05]" : "hover:bg-black/[0.02]"}`}>
                <span className="font-tight text-[13px] text-[#121212] line-clamp-1">{item.title}</span>
                <span className="font-tight text-[11px] text-black/30">/{item.slug}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
            <ContentEditor type="use-cases" item={selected} onSave={handleSave} onDelete={selected ? handleDelete : undefined} fields={USE_CASE_FIELDS} />
          </div>

          {selected && (
            <>
              <ArrayFieldEditor
                label="Pain Points"
                items={selected.painPoints || []}
                onUpdate={(v) => updateArrayField("painPoints", v)}
              />
              <ArrayFieldEditor
                label="Features"
                items={selected.features || []}
                onUpdate={(v) => updateArrayField("features", v)}
              />
              <ArrayFieldEditor
                label="Related Terms"
                items={selected.relatedTerms || []}
                onUpdate={(v) => updateArrayField("relatedTerms", v)}
                isSlug
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrayFieldEditor({ label, items, onUpdate, isSlug }: { label: string; items: string[]; onUpdate: (v: string[]) => void; isSlug?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(items.join("\n"));

  const save = () => {
    const lines = draft.split("\n").map((l) => l.trim()).filter(Boolean);
    onUpdate(lines);
    setEditing(false);
  };

  return (
    <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">{label}</h3>
        <button onClick={() => { setDraft(items.join("\n")); setEditing(!editing); }} className="font-tight text-[13px] text-black/40 hover:text-[#121212]">
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={Math.max(4, items.length + 1)} className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-3 font-tight text-[13px] leading-[1.6] text-[#121212] outline-none focus:border-black/30 resize-y" placeholder={isSlug ? "One slug per line" : "One item per line"} />
          <button onClick={save} className="h-[36px] self-start rounded-[8px] border border-black bg-[#121212] px-4 text-[13px] font-medium text-white hover:opacity-90">Save</button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-black/60">
              <span className="mt-1.5 size-[5px] shrink-0 rounded-full bg-[#c8ff00]" />
              <span className={isSlug ? "font-mono text-[12px]" : ""}>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
