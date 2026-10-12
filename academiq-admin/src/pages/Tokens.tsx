import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Trash2, Download, Check } from "lucide-react";
import {
  fetchTokens,
  generateTokens,
  deleteToken,
  type TokenRow,
} from "../services/adminService";

type FilterStatus = "all" | "unused" | "used";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "unused" },
  { label: "Redeemed", value: "used" },
];

export default function Tokens() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [genCount, setGenCount] = useState(10);
  const [genPrice, setGenPrice] = useState(2000);
  const [showGenForm, setShowGenForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tokens", filter],
    queryFn: () => fetchTokens(filter),
  });

  const generateMut = useMutation({
    mutationFn: () => generateTokens(genCount, genPrice),
    onSuccess: (codes) => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setShowGenForm(false);
      alert(`Generated ${codes.length} tokens:\n\n${codes.join("\n")}`);
    },
    onError: (e) => alert(`Failed: ${(e as Error).message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => alert(`Delete failed: ${(e as Error).message}`),
  });

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = (t: TokenRow) => {
    if (t.is_used) return alert("Redeemed tokens cannot be deleted.");
    if (confirm(`Delete token ${t.token_code}?`)) deleteMut.mutate(t.id);
  };

  const exportCsv = () => {
    if (!data?.rows.length) return;
    const header = "code,status,used_by,used_at,price_naira\n";
    const body = data.rows
      .map(
        (t) =>
          `${t.token_code},${t.is_used ? "used" : "unused"},${t.used_by_email ?? ""},${
            t.used_at ?? ""
          },${t.price_naira}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `academiq-tokens-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Token Engine</h2>
          <p className="text-sm text-text-secondary">
            Generate and track premium activation codes.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="px-4 py-2 bg-white border border-bg-border text-text-primary rounded-lg text-sm font-semibold hover:bg-bg-tertiary disabled:opacity-50 transition flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => setShowGenForm(true)}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={16} /> Generate Tokens
          </button>
        </div>
      </div>

      {/* Generate form */}
      {showGenForm && (
        <div className="bg-white rounded-xl border border-bg-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Generate Batch
          </h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Count (1–100)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={genCount}
                onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                className="w-32 px-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Price per token (₦)
              </label>
              <input
                type="number"
                min={0}
                value={genPrice}
                onChange={(e) => setGenPrice(parseInt(e.target.value) || 0)}
                className="w-40 px-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="px-5 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
            >
              {generateMut.isPending ? "Generating…" : "Generate"}
            </button>
            <button
              onClick={() => setShowGenForm(false)}
              className="px-5 py-2 bg-bg-tertiary text-text-secondary rounded-lg text-sm font-semibold hover:bg-bg-border transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f.value
                ? "bg-brand-primary text-white"
                : "bg-white border border-bg-border text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-bg-border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-muted text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-text-muted text-sm">
            No tokens yet. Click "Generate Tokens" to create your first batch.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Used by</th>
                <th className="px-4 py-3">Used at</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-bg-border hover:bg-bg-tertiary/50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-text-primary">
                    {t.token_code}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        t.is_used
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {t.is_used ? "Redeemed" : "Available"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {t.used_by_email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {t.used_at ? new Date(t.used_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary font-semibold">
                    ₦{t.price_naira.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => copyCode(t.token_code, t.id)}
                        className="p-2 rounded-md hover:bg-bg-tertiary text-text-secondary"
                        title="Copy"
                      >
                        {copiedId === t.id ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={t.is_used}
                        className={`p-2 rounded-md ${
                          t.is_used
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-red-50 text-red-500"
                        }`}
                        title={t.is_used ? "Redeemed — locked" : "Delete"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <p className="text-xs text-text-muted text-center">
          Showing {rows.length} of {total}
        </p>
      )}
    </div>
  );
}