"use client";

import { useState, useEffect } from "react";

interface CmsItem {
  slug: string;
  [key: string]: any;
}

interface ContentEditorProps {
  type: string;
  item: CmsItem | null;
  onSave: (data: any) => Promise<void>;
  onDelete?: () => Promise<void>;
  fields: FieldConfig[];
}

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "json" | "slug" | "date" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export function ContentEditor({ type, item, onSave, onDelete, fields }: ContentEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      const initial: Record<string, any> = {};
      fields.forEach((f) => {
        initial[f.key] = f.type === "json" ? [] : f.type === "date" ? new Date().toISOString().split("T")[0] : "";
      });
      initial.slug = "";
      setFormData(initial);
    }
  }, [item, fields]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleJsonChange = (key: string, index: number, field: string, value: string) => {
    const arr = [...(formData[key] || [])];
    arr[index] = { ...arr[index], [field]: value };
    setFormData((prev) => ({ ...prev, [key]: arr }));
  };

  const addJsonItem = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), {}],
    }));
  };

  const removeJsonItem = (key: string, index: number) => {
    const arr = [...(formData[key] || [])];
    arr.splice(index, 1);
    setFormData((prev) => ({ ...prev, [key]: arr }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await onSave(formData);
      setMessage("Saved successfully!");
    } catch (err: any) {
      setMessage(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this?")) return;
    if (onDelete) {
      await onDelete();
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key] ?? "";

    if (field.type === "text") {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-tight text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30 placeholder:text-black/30"
        />
      );
    }

    if (field.type === "slug") {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
          placeholder="url-friendly-slug"
          className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-mono text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30 placeholder:text-black/30"
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-tight text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30"
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={6}
          className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-3 font-tight text-[14px] leading-[1.6] text-[#121212] outline-none transition-colors focus:border-black/30 placeholder:text-black/30 resize-y"
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-tight text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30"
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (field.type === "json") {
      const items = value || [];
      return (
        <div className="flex flex-col gap-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="rounded-[10px] border border-black/10 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-tight text-[12px] text-black/30">#{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeJsonItem(field.key, index)}
                  className="font-tight text-[12px] text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {Object.keys(item).map((objKey) => (
                  <div key={objKey}>
                    <label className="mb-1 block font-tight text-[11px] text-black/40">{objKey}</label>
                    <input
                      type="text"
                      value={item[objKey] || ""}
                      onChange={(e) => handleJsonChange(field.key, index, objKey, e.target.value)}
                      className="h-[36px] w-full rounded-[8px] border border-black/10 bg-[#f5f5f2] px-3 font-tight text-[13px] text-[#121212] outline-none focus:border-black/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addJsonItem(field.key)}
            className="flex h-9 items-center justify-center rounded-[8px] border border-dashed border-black/10 font-tight text-[13px] text-black/40 transition-colors hover:border-black/20 hover:text-[#121212]"
          >
            + Add item
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">
            {field.label}
            {field.required && <span className="ml-1 text-red-400">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}

      {message && (
        <p className={`text-[13px] ${message.includes("success") ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-[42px] rounded-[10px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {item && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="h-[42px] rounded-[10px] border border-red-200 px-6 text-[14px] font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
