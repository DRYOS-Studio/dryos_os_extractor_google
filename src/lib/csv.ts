export function leadsToCSV(leads: Array<Record<string, unknown>>): string {
  const headers = ["name", "category", "phone", "website", "email", "rating", "reviews_count", "address", "city", "state", "google_url"];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const rows = leads.map((l) => headers.map((h) => escape(l[h])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadXLSX(filename: string, leads: Array<Record<string, unknown>>) {
  const XLSX = await import("xlsx");
  const headers = ["name", "category", "phone", "website", "email", "rating", "reviews_count", "address", "city", "state", "google_url"];
  const rows = leads.map((l) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h) => (obj[h] = l[h] ?? ""));
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, filename);
}
