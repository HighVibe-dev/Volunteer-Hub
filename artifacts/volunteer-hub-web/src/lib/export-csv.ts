export function exportToCSV(
  data: Record<string, any>[],
  filename: string,
  headers?: Record<string, string>
): void {
  if (!data || data.length === 0) return;

  const keys = Object.keys(data[0]);
  const headerRow = headers
    ? keys.map((k) => headers[k] ?? k).join(",")
    : keys.join(",");

  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str}"`
          : str;
      })
      .join(",")
  );

  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
