/**
 * Exports an array of objects to a downloadable CSV file.
 * @param {Array<Object>} data - Array of records to export.
 * @param {string} filename - Filename including .csv extension.
 */
export function exportToCSV(data, filename = "export.csv") {
  if (!data || !data.length) {
    alert("No records to export.");
    return;
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const stringVal = String(value).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const csvRows = [
    headers.map(escapeCSV).join(","), // Header row
    ...data.map((row) =>
      headers.map((fieldName) => escapeCSV(row[fieldName])).join(",")
    ),
  ];

  const csvString = csvRows.join("\r\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
