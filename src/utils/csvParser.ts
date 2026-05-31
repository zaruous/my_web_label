/**
 * Parses raw CSV text into a dataset array of key-value objects.
 * Designed as a pure function to be highly testable.
 * 
 * @param csvText The raw CSV file content text.
 * @returns Array of Record objects where keys are header values.
 */
export function parseCSVToDataset(csvText: string): Record<string, string>[] {
  if (!csvText) return [];
  
  // Split lines by carriage return and/or newline
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  // Extract and clean the headers from the first row
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  if (headers.length === 0 || !headers[0]) return [];

  const result: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty rows
    
    // Split line values by comma and clean leading/trailing quotes
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        // Fallback to empty string if header index exceeds available values
        row[header] = values[index] !== undefined ? values[index] : '';
      }
    });
    result.push(row);
  }
  
  return result;
}
