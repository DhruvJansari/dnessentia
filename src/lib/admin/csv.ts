import "server-only";

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens rupee signs and Indian names correctly. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    // Leading = + - @ would be treated as formulas by spreadsheet apps.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

export function csvResponse(filename: string, body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Parses ?from=YYYY-MM-DD&to=YYYY-MM-DD as IST calendar days. */
export function dateRange(url: URL) {
  const valid = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  const from = valid(url.searchParams.get("from"));
  const to = valid(url.searchParams.get("to"));
  return {
    from: from ? new Date(`${from}T00:00:00+05:30`) : null,
    to: to ? new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 864e5) : null,
    label: `${from ?? "start"}_to_${to ?? "today"}`,
  };
}
