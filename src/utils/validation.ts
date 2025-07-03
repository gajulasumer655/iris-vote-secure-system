// Validate Voter ID format: 10 characters, starts with letter, ends with number
export const validateVoterIdFormat = (voterId: string): boolean => {
  if (voterId.length !== 10) {
    return false;
  }
  
  const firstChar = voterId.charAt(0);
  const lastChar = voterId.charAt(9);
  
  // Check if first character is a letter
  const isFirstCharLetter = /^[A-Za-z]$/.test(firstChar);
  
  // Check if last character is a number
  const isLastCharNumber = /^[0-9]$/.test(lastChar);
  
  return isFirstCharLetter && isLastCharNumber;
};

// MAXIMUM SECURITY Face Image Quality Validation
export const validateFaceImageQuality = (faceData: string): { isValid: boolean; score: number; details: string } => {
  console.log('=== MAXIMUM SECURITY FACE IMAGE QUALITY VALIDATION ===');
  
  if (!faceData || typeof faceData !== 'string') {
    return { isValid: false, score: 0, details: 'No face data provided' };
  }

  // Check if it's a proper data URL
  if (!faceData.startsWith('data:image/')) {
    return { isValid: false, score: 0, details: 'Invalid image format - not a data URL' };
  }

  // Check if it contains base64 data
  if (!faceData.includes('base64,')) {
    return { isValid: false, score: 0, details: 'Invalid image format - no base64 data' };
  }

  const base64Data = faceData.split('base64,')[1];
  
  // EXTREMELY STRICT length requirements - increased from 15000 to 20000
  if (base64Data.length < 20000) {
    return { isValid: false, score: 0, details: `Image quality too low - data length: ${base64Data.length}, minimum required: 20000` };
  }

  // Enhanced complexity check with higher threshold
  const uniqueChars = new Set(base64Data).size;
  const complexityScore = uniqueChars / 64; // base64 has 64 possible characters
  
  if (complexityScore < 0.85) { // Increased from 0.8 to 0.85
    return { isValid: false, score: complexityScore, details: `Image complexity too low - unique characters: ${uniqueChars}/64, minimum required: 85%` };
  }

  // Enhanced header validation
  const jpegSignatures = ['/9j/', 'iVBOR', 'R0lGOD'];
  const hasValidHeader = jpegSignatures.some(sig => base64Data.startsWith(sig));
  
  if (!hasValidHeader) {
    return { isValid: false, score: 0, details: 'Invalid image header - possibly corrupted' };
  }

  // Additional entropy check for image quality
  const calculateEntropy = (data: string): number => {
    const freq: { [key: string]: number } = {};
    for (let i = 0; i < data.length; i++) {
      freq[data[i]] = (freq[data[i]] || 0) + 1;
    }
    
    let entropy = 0;
    const len = data.length;
    for (const key in freq) {
      const p = freq[key] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  };

  const entropy = calculateEntropy(base64Data);
  const minEntropy = 4.5; // High entropy indicates good image quality
  
  if (entropy < minEntropy) {
    return { isValid: false, score: entropy / 6, details: `Image entropy too low: ${entropy.toFixed(2)}, minimum required: ${minEntropy}` };
  }

  console.log(`Face image quality validation PASSED - Length: ${base64Data.length}, Complexity: ${(complexityScore * 100).toFixed(1)}%, Entropy: ${entropy.toFixed(2)}`);
  return { isValid: true, score: 1, details: 'Valid ultra-high-quality face image' };
};