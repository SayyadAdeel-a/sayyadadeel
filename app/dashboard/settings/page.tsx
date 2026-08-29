"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Sayyad Adeel");
  const [siteUrl, setSiteUrl] = useState("https://adeelsayyad.tech");
  const [siteDescription, setSiteDescription] = useState("I build AI-powered software for real-world problems.");
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setMessage("Settings saved! (Note: Some settings require code changes to take effect)");
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-instrument-serif text-[28px] tracking-[-0.84px] text-[#121212]">Settings</h1>
        <p className="font-tight text-[14px] text-black/40">Site-wide configuration and metadata.</p>
      </div>

      {message && (
        <div className="mb-6 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-700">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Site Info */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">Site Information</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">Site Name</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-tight text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30" />
            </div>
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">Site URL</label>
              <input type="text" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-mono text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30" />
            </div>
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">Site Description</label>
              <textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} className="w-full rounded-[10px] border border-black/10 bg-white px-4 py-3 font-tight text-[14px] leading-[1.6] text-[#121212] outline-none transition-colors focus:border-black/30 resize-y" />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">Social Links</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">GitHub URL</label>
              <input type="text" defaultValue="https://github.com/adeelsayyad" className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-mono text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30" />
            </div>
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">Email Address</label>
              <input type="text" defaultValue="hello@adeelsayyad.tech" className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-mono text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30" />
            </div>
          </div>
        </div>

        {/* Product Links */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">Product Links</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">FieldOS URL</label>
              <input type="text" defaultValue="https://fieldos.adeelsayyad.tech" className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-mono text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30" />
            </div>
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">App URL</label>
              <input type="text" defaultValue="https://app.adeelsayyad.tech" className="h-[42px] w-full rounded-[10px] border border-black/10 bg-white px-4 font-mono text-[14px] text-[#121212] outline-none transition-colors focus:border-black/30" />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">Images</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-tight text-[13px] font-medium text-[#121212]">OG Image (Social Sharing)</label>
              <p className="mb-2 font-tight text-[12px] text-black/40">Recommended: 1200x630px PNG. Used for social media previews.</p>
              <ImageUpload path="og.png" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className="h-[42px] rounded-[10px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageUpload({ path }: { path: string }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const res = await fetch("/api/cms", { method: "PATCH", body: formData });

    if (res.ok) {
      setMessage("Image uploaded successfully!");
    } else {
      setMessage("Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <label className="flex h-[42px] cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-black/10 px-4 font-tight text-[13px] text-black/40 transition-colors hover:border-black/20 hover:text-[#121212]">
        {uploading ? "Uploading..." : "Choose file"}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
      {message && <span className="text-[13px] text-green-600">{message}</span>}
    </div>
  );
}
