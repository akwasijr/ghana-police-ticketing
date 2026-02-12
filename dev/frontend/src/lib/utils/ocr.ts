import Tesseract from 'tesseract.js';

interface ScannedData {
  text: string;
  idNumber?: string;
  firstName?: string;
  lastName?: string;
}

export async function scanIdCard(imageFile: File | Blob | string): Promise<ScannedData> {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      { 
        logger: m => console.log(m) // Optional: log progress
      }
    );

    const text = result.data.text;
    
    // Basic parsing logic for Ghana Card / Driver's License
    // This is a heuristic approach and might need refinement based on actual card layouts
    
    const data: ScannedData = {
      text: text
    };

    // 1. Try to find Ghana Card Number (Format: GHA-000000000-0)
    const ghanaCardRegex = /GHA-\d{9}-\d/g;
    const ghanaCardMatch = text.match(ghanaCardRegex);
    if (ghanaCardMatch) {
      data.idNumber = ghanaCardMatch[0];
    }

    // 2. Try to find Driver's License (Often just numbers or alphanumeric)
    // This is harder to distinguish without context, but we can look for keywords
    if (!data.idNumber) {
      // Look for "Licence No." or similar
      const licenseLabelRegex = /(?:Licence|License)\s*(?:No\.?|Number)\s*[:.]?\s*([A-Z0-9]+)/i;
      const licenseMatch = text.match(licenseLabelRegex);
      if (licenseMatch && licenseMatch[1]) {
        data.idNumber = licenseMatch[1];
      }
    }

    // 3. Try to extract names (Very basic heuristic)
    // Ghana Cards often have "Surname" and "First Name" labels
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (line.includes('surname')) {
        // The surname is usually on the next line or same line
        if (line.includes(':')) {
           data.lastName = line.split(':')[1].trim();
        } else if (i + 1 < lines.length) {
           data.lastName = lines[i + 1];
        }
      }
      
      if (line.includes('first name') || line.includes('forenames')) {
        if (line.includes(':')) {
           data.firstName = line.split(':')[1].trim();
        } else if (i + 1 < lines.length) {
           data.firstName = lines[i + 1];
        }
      }
    }

    return data;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to scan document');
  }
}
