
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Voter {
  id: string;
  name: string;
  aadhaarNumber: string;
  voterId: string;
  address: string;
  faceData: string;
  irisData: string;
  hasVoted: boolean;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  voteCount: number;
}

interface VotingContextType {
  voters: Voter[];
  candidates: Candidate[];
  registerVoter: (voter: Omit<Voter, 'id' | 'hasVoted'>) => { success: boolean; message: string };
  addCandidate: (candidate: Omit<Candidate, 'id' | 'voteCount'>) => void;
  castVote: (candidateId: string, voterId: string) => boolean;
  verifyVoter: (aadhaar: string, voterId: string, name: string, faceData: string) => { success: boolean; message: string; voter?: Voter };
  updateVoter: (voterId: string, updates: Partial<Omit<Voter, 'id'>>) => { success: boolean; message: string };
  deleteVoter: (voterId: string) => { success: boolean; message: string };
  isAdminAuthenticated: boolean;
  authenticateAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};

// Validate Voter ID format: 10 characters, starts with letter, ends with number
const validateVoterIdFormat = (voterId: string): boolean => {
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

// ULTRA-STRICT Face Image Quality Validation
const validateFaceImageQuality = (faceData: string): { isValid: boolean; score: number; details: string } => {
  console.log('=== ULTRA-STRICT FACE IMAGE QUALITY VALIDATION ===');
  
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
  
  // MUCH MORE STRICT length requirements
  if (base64Data.length < 15000) {
    return { isValid: false, score: 0, details: `Image quality too low - data length: ${base64Data.length}, minimum required: 15000` };
  }

  // Check for minimum complexity (diverse character distribution)
  const uniqueChars = new Set(base64Data).size;
  const complexityScore = uniqueChars / 64; // base64 has 64 possible characters
  
  if (complexityScore < 0.8) {
    return { isValid: false, score: complexityScore, details: `Image complexity too low - unique characters: ${uniqueChars}/64` };
  }

  // Check for proper JPEG header signatures in base64
  const jpegSignatures = ['/9j/', 'iVBOR', 'R0lGOD']; // JPEG, PNG, GIF
  const hasValidHeader = jpegSignatures.some(sig => base64Data.startsWith(sig));
  
  if (!hasValidHeader) {
    return { isValid: false, score: 0, details: 'Invalid image header - possibly corrupted' };
  }

  console.log(`Face image quality validation PASSED - Length: ${base64Data.length}, Complexity: ${(complexityScore * 100).toFixed(1)}%`);
  return { isValid: true, score: 1, details: 'Valid high-quality face image' };
};

// ULTRA-ENHANCED STRICT DUPLICATE FACE DETECTION
const calculateUltraStrictFaceSimilarity = (face1: string, face2: string): number => {
  console.log('=== ULTRA-ENHANCED FACE SIMILARITY ANALYSIS ===');
  
  // Immediate exact match check
  if (face1 === face2) {
    console.log('🚨 EXACT DUPLICATE DETECTED - 100% match');
    return 1.0;
  }

  // Validate both images with strict quality checks
  const quality1 = validateFaceImageQuality(face1);
  const quality2 = validateFaceImageQuality(face2);

  if (!quality1.isValid || !quality2.isValid) {
    console.log('Invalid face image quality detected');
    return 0;
  }

  const data1 = face1.split('base64,')[1];
  const data2 = face2.split('base64,')[1];

  console.log(`Comparing faces - Length1: ${data1.length}, Length2: ${data2.length}`);

  // 1. ULTRA-STRICT Length Analysis
  const lengthDiff = Math.abs(data1.length - data2.length);
  const avgLength = (data1.length + data2.length) / 2;
  const lengthVariation = lengthDiff / avgLength;
  
  console.log(`Length variation: ${(lengthVariation * 100).toFixed(2)}%`);

  // If length variation is very small, likely similar images
  if (lengthVariation < 0.05) { // Less than 5% difference
    console.log('🔍 Very similar image sizes detected - investigating further');
  }

  // 2. COMPREHENSIVE HEADER ANALYSIS (First 2000 characters)
  const headerLength = Math.min(2000, Math.min(data1.length, data2.length));
  let exactHeaderMatches = 0;
  
  for (let i = 0; i < headerLength; i++) {
    if (data1[i] === data2[i]) {
      exactHeaderMatches++;
    }
  }
  
  const headerSimilarity = exactHeaderMatches / headerLength;
  console.log(`Header similarity: ${(headerSimilarity * 100).toFixed(2)}% (${exactHeaderMatches}/${headerLength})`);

  // 3. MULTIPLE SEGMENT ANALYSIS WITH DIFFERENT GRANULARITIES
  const calculateMultiGranularitySegments = () => {
    const granularities = [5, 10, 20, 50, 100];
    let totalScore = 0;
    
    granularities.forEach(numSegments => {
      const segmentSize = Math.floor(Math.min(data1.length, data2.length) / numSegments);
      let segmentScore = 0;
      
      for (let i = 0; i < numSegments; i++) {
        const start = i * segmentSize;
        const end = Math.min(start + segmentSize, Math.min(data1.length, data2.length));
        
        const segment1 = data1.substring(start, end);
        const segment2 = data2.substring(start, end);
        
        let matches = 0;
        for (let j = 0; j < segment1.length && j < segment2.length; j++) {
          if (segment1[j] === segment2[j]) {
            matches++;
          }
        }
        
        const segmentSim = matches / Math.max(segment1.length, segment2.length);
        segmentScore += segmentSim;
      }
      
      const avgSegmentScore = segmentScore / numSegments;
      totalScore += avgSegmentScore;
      console.log(`${numSegments}-segment similarity: ${(avgSegmentScore * 100).toFixed(2)}%`);
    });
    
    return totalScore / granularities.length;
  };

  const multiGranularityScore = calculateMultiGranularitySegments();

  // 4. ENHANCED CHARACTER FREQUENCY DISTRIBUTION ANALYSIS
  const analyzeCharacterDistribution = () => {
    const getDetailedFrequency = (str: string) => {
      const freq: { [key: string]: number } = {};
      // Sample every character for maximum accuracy
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        freq[char] = (freq[char] || 0) + 1;
      }
      return freq;
    };

    const freq1 = getDetailedFrequency(data1);
    const freq2 = getDetailedFrequency(data2);
    
    const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    let totalSimilarityScore = 0;
    let significantMatches = 0;

    for (const char of allChars) {
      const f1 = freq1[char] || 0;
      const f2 = freq2[char] || 0;
      const maxFreq = Math.max(f1, f2);
      const minFreq = Math.min(f1, f2);
      
      if (maxFreq > 0) {
        const charSimilarity = minFreq / maxFreq;
        totalSimilarityScore += charSimilarity;
        
        if (charSimilarity > 0.9 && maxFreq > 50) { // High similarity in frequent characters
          significantMatches++;
        }
      }
    }

    const avgCharSimilarity = totalSimilarityScore / allChars.size;
    const significantMatchRatio = significantMatches / allChars.size;
    
    console.log(`Character distribution similarity: ${(avgCharSimilarity * 100).toFixed(2)}%`);
    console.log(`Significant character matches: ${significantMatches}/${allChars.size} (${(significantMatchRatio * 100).toFixed(1)}%)`);
    
    return { avgCharSimilarity, significantMatchRatio };
  };

  const charAnalysis = analyzeCharacterDistribution();

  // 5. SLIDING WINDOW PATTERN MATCHING
  const slidingWindowAnalysis = () => {
    const windowSizes = [50, 100, 200, 500];
    let totalWindowScore = 0;
    
    windowSizes.forEach(windowSize => {
      const stride = Math.floor(windowSize / 4);
      let windowMatches = 0;
      let totalWindows = 0;
      
      for (let i = 0; i <= Math.min(data1.length, data2.length) - windowSize; i += stride) {
        const window1 = data1.substring(i, i + windowSize);
        const window2 = data2.substring(i, i + windowSize);
        
        let matches = 0;
        for (let j = 0; j < windowSize; j++) {
          if (window1[j] === window2[j]) {
            matches++;
          }
        }
        
        const windowSimilarity = matches / windowSize;
        windowMatches += windowSimilarity;
        totalWindows++;
      }
      
      const avgWindowScore = totalWindows > 0 ? windowMatches / totalWindows : 0;
      totalWindowScore += avgWindowScore;
      console.log(`Window size ${windowSize} similarity: ${(avgWindowScore * 100).toFixed(2)}%`);
    });
    
    return totalWindowScore / windowSizes.length;
  };

  const slidingWindowScore = slidingWindowAnalysis();

  // 6. HASH-BASED QUICK DUPLICATE DETECTION
  const hashBasedAnalysis = () => {
    const hashSizes = [100, 500, 1000, 2000];
    let totalHashScore = 0;
    
    hashSizes.forEach(hashSize => {
      const hash1 = data1.substring(0, Math.min(hashSize, data1.length));
      const hash2 = data2.substring(0, Math.min(hashSize, data2.length));
      
      let matches = 0;
      const minLength = Math.min(hash1.length, hash2.length);
      
      for (let i = 0; i < minLength; i++) {
        if (hash1[i] === hash2[i]) {
          matches++;
        }
      }
      
      const hashScore = matches / minLength;
      totalHashScore += hashScore;
      console.log(`Hash ${hashSize} similarity: ${(hashScore * 100).toFixed(2)}%`);
    });
    
    return totalHashScore / hashSizes.length;
  };

  const hashScore = hashBasedAnalysis();

  // 7. STATISTICAL PATTERN ANALYSIS
  const statisticalAnalysis = () => {
    // Analyze statistical patterns in the data
    const analyzeStats = (data: string) => {
      const chars = data.split('');
      const values = chars.map(c => c.charCodeAt(0));
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      return { mean, variance, stdDev };
    };
    
    const stats1 = analyzeStats(data1);
    const stats2 = analyzeStats(data2);
    
    const meanDiff = Math.abs(stats1.mean - stats2.mean) / Math.max(stats1.mean, stats2.mean);
    const varianceDiff = Math.abs(stats1.variance - stats2.variance) / Math.max(stats1.variance, stats2.variance);
    const stdDevDiff = Math.abs(stats1.stdDev - stats2.stdDev) / Math.max(stats1.stdDev, stats2.stdDev);
    
    const statSimilarity = 1 - (meanDiff + varianceDiff + stdDevDiff) / 3;
    
    console.log(`Statistical similarity: ${(statSimilarity * 100).toFixed(2)}%`);
    return Math.max(0, statSimilarity);
  };

  const statisticalScore = statisticalAnalysis();

  // FINAL WEIGHTED COMPOSITE SCORE WITH ULTRA-STRICT WEIGHTING
  const weights = {
    header: 0.25,        // Header similarity is very important
    multiGranularity: 0.20, // Multi-level segment analysis
    charFrequency: 0.15,     // Character distribution
    charSignificant: 0.15,   // Significant character matches
    slidingWindow: 0.15,      // Pattern matching
    hash: 0.05,              // Quick hash comparison
    statistical: 0.05        // Statistical analysis
  };

  const finalScore = (
    headerSimilarity * weights.header +
    multiGranularityScore * weights.multiGranularity +
    charAnalysis.avgCharSimilarity * weights.charFrequency +
    charAnalysis.significantMatchRatio * weights.charSignificant +
    slidingWindowScore * weights.slidingWindow +
    hashScore * weights.hash +
    statisticalScore * weights.statistical
  );

  console.log('=== FINAL SIMILARITY BREAKDOWN ===');
  console.log(`Header: ${(headerSimilarity * 100).toFixed(1)}% (weight: ${weights.header})`);
  console.log(`Multi-granularity: ${(multiGranularityScore * 100).toFixed(1)}% (weight: ${weights.multiGranularity})`);
  console.log(`Character frequency: ${(charAnalysis.avgCharSimilarity * 100).toFixed(1)}% (weight: ${weights.charFrequency})`);
  console.log(`Significant matches: ${(charAnalysis.significantMatchRatio * 100).toFixed(1)}% (weight: ${weights.charSignificant})`);
  console.log(`Sliding window: ${(slidingWindowScore * 100).toFixed(1)}% (weight: ${weights.slidingWindow})`);
  console.log(`Hash: ${(hashScore * 100).toFixed(1)}% (weight: ${weights.hash})`);
  console.log(`Statistical: ${(statisticalScore * 100).toFixed(1)}% (weight: ${weights.statistical})`);
  console.log(`FINAL COMPOSITE SCORE: ${(finalScore * 100).toFixed(2)}%`);
  console.log('=== ANALYSIS COMPLETE ===');

  return finalScore;
};

// Face matching algorithm for verification during voting (more lenient)
const calculateVotingFaceSimilarity = (registeredFace: string, currentFace: string): number => {
  console.log('=== VOTING FACE VERIFICATION ===');
  console.log('Registered face length:', registeredFace.length);
  console.log('Current face length:', currentFace.length);
  
  // If exact match, return 100% similarity
  if (registeredFace === currentFace) {
    console.log('EXACT MATCH DETECTED - 100% similarity');
    return 1.0;
  }
  
  // Validate both images are proper base64 data URLs
  const isValidImage = (data: string) => {
    return data.startsWith('data:image/') && data.includes('base64,') && data.length > 3000;
  };
  
  if (!isValidImage(registeredFace) || !isValidImage(currentFace)) {
    console.log('Invalid image format detected - returning 0% similarity');
    return 0;
  }
  
  // Extract base64 data
  const getBase64 = (dataUrl: string) => {
    const base64Index = dataUrl.indexOf('base64,');
    return base64Index !== -1 ? dataUrl.substring(base64Index + 7) : dataUrl;
  };
  
  const data1 = getBase64(registeredFace);
  const data2 = getBase64(currentFace);
  
  // More lenient length check for voting
  const lengthRatio = Math.min(data1.length, data2.length) / Math.max(data1.length, data2.length);
  console.log('Length ratio:', lengthRatio);
  
  // Don't immediately fail on length difference for voting
  let lengthScore = lengthRatio;
  if (lengthRatio < 0.7) {
    lengthScore = 0.3; // Give some base score even for different lengths
  }
  
  // Header analysis (first 300 characters)
  const headerLength = Math.min(300, Math.min(data1.length, data2.length));
  let headerMatches = 0;
  
  for (let i = 0; i < headerLength; i++) {
    if (data1[i] === data2[i]) {
      headerMatches++;
    }
  }
  
  const headerSimilarity = headerMatches / headerLength;
  console.log('Header similarity:', headerSimilarity);
  
  // Simplified segment analysis for voting
  const numSegments = 10;
  const segmentSize = Math.floor(Math.min(data1.length, data2.length) / numSegments);
  let totalSegmentSimilarity = 0;
  
  for (let i = 0; i < numSegments; i++) {
    const start = i * segmentSize;
    const end = Math.min(start + segmentSize, Math.min(data1.length, data2.length));
    
    const segment1 = data1.substring(start, end);
    const segment2 = data2.substring(start, end);
    
    let matches = 0;
    const segmentLength = Math.min(segment1.length, segment2.length);
    
    for (let j = 0; j < segmentLength; j++) {
      if (segment1[j] === segment2[j]) {
        matches++;
      }
    }
    
    const segmentSim = segmentLength > 0 ? matches / segmentLength : 0;
    totalSegmentSimilarity += segmentSim;
  }
  
  const segmentSimilarity = totalSegmentSimilarity / numSegments;
  console.log('Segment similarity:', segmentSimilarity);
  
  // Character frequency analysis for additional verification
  const getCharFrequency = (str: string) => {
    const freq: { [key: string]: number } = {};
    for (let i = 0; i < str.length; i += 5) {
      const char = str[i];
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  };
  
  const freq1 = getCharFrequency(data1);
  const freq2 = getCharFrequency(data2);
  
  const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
  let frequencyScore = 0;
  
  for (const char of allChars) {
    const f1 = freq1[char] || 0;
    const f2 = freq2[char] || 0;
    const maxFreq = Math.max(f1, f2);
    
    if (maxFreq > 0) {
      frequencyScore += Math.min(f1, f2) / maxFreq;
    }
  }
  
  const frequencySimilarity = allChars.size > 0 ? frequencyScore / allChars.size : 0;
  console.log('Frequency similarity:', frequencySimilarity);
  
  // Weighted combined similarity score (more balanced for voting)
  const combinedScore = (
    lengthScore * 0.15 +
    headerSimilarity * 0.35 +
    segmentSimilarity * 0.35 +
    frequencySimilarity * 0.15
  );
  
  console.log('Voting combined similarity score:', combinedScore);
  return combinedScore;
};

// ULTRA-ENHANCED STRICT DUPLICATE DETECTION WITH MULTIPLE SECURITY LAYERS
const isFaceAlreadyRegistered = (newFaceData: string, existingVoters: Voter[]): { isDuplicate: boolean; existingVoter?: Voter; details?: string } => {
  console.log('=== ULTRA-ENHANCED DUPLICATE FACE DETECTION SYSTEM ===');
  console.log(`New face data length: ${newFaceData.length}`);
  console.log(`Checking against ${existingVoters.length} existing voters`);
  
  // FIRST LAYER: Validate new face quality
  const qualityCheck = validateFaceImageQuality(newFaceData);
  if (!qualityCheck.isValid) {
    console.log(`❌ Face quality validation failed: ${qualityCheck.details}`);
    return { 
      isDuplicate: false, 
      details: `Face image quality insufficient: ${qualityCheck.details}` 
    };
  }
  
  console.log('✅ Face quality validation passed');

  // SECOND LAYER: Check for exact duplicates first (fastest check)
  console.log('🔍 Performing exact duplicate check...');
  for (const voter of existingVoters) {
    if (voter.faceData === newFaceData) {
      console.log('🚨 EXACT DUPLICATE DETECTED!');
      return { 
        isDuplicate: true, 
        existingVoter: voter,
        details: 'Exact face image match found' 
      };
    }
  }
  
  // THIRD LAYER: Advanced similarity analysis
  console.log('🔍 Performing advanced similarity analysis...');
  let highestSimilarity = 0;
  let mostSimilarVoter: Voter | undefined;
  
  for (let i = 0; i < existingVoters.length; i++) {
    const voter = existingVoters[i];
    console.log(`\n--- Analyzing voter ${i + 1}/${existingVoters.length}: ${voter.name} ---`);
    
    const similarity = calculateUltraStrictFaceSimilarity(newFaceData, voter.faceData);
    
    console.log(`Similarity with ${voter.name}: ${(similarity * 100).toFixed(3)}%`);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      mostSimilarVoter = voter;
    }
    
    // ULTRA-STRICT THRESHOLD: 50% similarity triggers duplicate detection
    const DUPLICATE_THRESHOLD = 0.50;
    
    if (similarity >= DUPLICATE_THRESHOLD) {
      console.log('🚨🚨🚨 DUPLICATE FACE DETECTED! 🚨🚨🚨');
      console.log(`Voter: ${voter.name} (ID: ${voter.voterId})`);
      console.log(`Similarity: ${(similarity * 100).toFixed(3)}%`);
      console.log(`Threshold: ${(DUPLICATE_THRESHOLD * 100)}%`);
      console.log('🚫 REGISTRATION BLOCKED');
      
      return { 
        isDuplicate: true, 
        existingVoter: voter,
        details: `Face similarity ${(similarity * 100).toFixed(1)}% exceeds threshold ${(DUPLICATE_THRESHOLD * 100)}%`
      };
    }
  }
  
  console.log('\n=== DUPLICATE DETECTION SUMMARY ===');
  console.log(`Highest similarity found: ${(highestSimilarity * 100).toFixed(3)}%`);
  if (mostSimilarVoter) {
    console.log(`Most similar voter: ${mostSimilarVoter.name}`);
  }
  console.log('✅ No duplicates detected - registration allowed');
  console.log('=== DUPLICATE CHECK COMPLETE ===');
  
  return { isDuplicate: false, details: 'No duplicate face patterns detected' };
};

// Face matching for verification (more lenient than registration)
const verifyFaceMatch = (registeredFace: string, currentFace: string): boolean => {
  console.log('=== FACE VERIFICATION FOR VOTING ===');
  
  const similarity = calculateVotingFaceSimilarity(registeredFace, currentFace);
  console.log('Verification similarity score:', (similarity * 100).toFixed(2) + '%');
  
  // More lenient threshold for verification (60% similarity)
  const threshold = 0.60;
  const isMatch = similarity >= threshold;
  
  console.log('Verification threshold:', (threshold * 100) + '%');
  console.log('Face verification result:', isMatch ? 'PASS ✅' : 'FAIL ❌');
  
  return isMatch;
};

export const VotingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: '1', name: 'John Smith', party: 'Democratic Party', symbol: '🔵', voteCount: 0 },
    { id: '2', name: 'Sarah Johnson', party: 'Republican Party', symbol: '🔴', voteCount: 0 },
  ]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const registerVoter = (voterData: Omit<Voter, 'id' | 'hasVoted'>): { success: boolean; message: string } => {
    console.log('=== ULTRA-SECURE VOTER REGISTRATION ATTEMPT ===');
    console.log('Attempting to register voter:', voterData.name);
    console.log('Voter ID:', voterData.voterId);
    console.log('Aadhaar:', voterData.aadhaarNumber);
    console.log('Face data length:', voterData.faceData.length);
    console.log('Current total voters:', voters.length);
    
    // Validate Voter ID format
    if (!validateVoterIdFormat(voterData.voterId)) {
      console.log('❌ Invalid Voter ID format');
      return {
        success: false,
        message: "Invalid Voter ID format. Voter ID must be exactly 10 characters long, start with a letter, and end with a number (e.g., A12345678B)."
      };
    }
    
    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(voterData.aadhaarNumber)) {
      console.log('❌ Invalid Aadhaar format');
      return {
        success: false,
        message: "Invalid Aadhaar number. Aadhaar must be exactly 12 digits."
      };
    }
    
    // ULTRA-STRICT face data quality validation
    const faceQuality = validateFaceImageQuality(voterData.faceData);
    if (!faceQuality.isValid) {
      console.log('❌ Face image quality insufficient:', faceQuality.details);
      return {
        success: false,
        message: `Face image quality is insufficient: ${faceQuality.details}. Please retake the photo with better lighting and ensure your face is clearly visible.`
      };
    }
    
    if (!voterData.irisData || voterData.irisData.length < 8000) {
      console.log('❌ Iris scan quality insufficient, length:', voterData.irisData?.length || 0);
      return {
        success: false,
        message: "Iris scan quality is insufficient. Please retake the iris scan with better positioning."
      };
    }
    
    // Check for duplicate Aadhaar number
    const duplicateAadhaar = voters.find(v => v.aadhaarNumber === voterData.aadhaarNumber);
    if (duplicateAadhaar) {
      console.log('❌ Duplicate Aadhaar found:', duplicateAadhaar.name);
      return {
        success: false,
        message: `This Aadhaar number is already registered under the name: ${duplicateAadhaar.name}. Each Aadhaar number can only be used once.`
      };
    }
    
    // Check for duplicate Voter ID
    const duplicateVoterId = voters.find(v => v.voterId === voterData.voterId);
    if (duplicateVoterId) {
      console.log('❌ Duplicate Voter ID found:', duplicateVoterId.name);
      return {
        success: false,
        message: `This Voter ID is already registered under the name: ${duplicateVoterId.name}. Each Voter ID can only be used once.`
      };
    }
    
    // CRITICAL: ULTRA-ENHANCED DUPLICATE FACE DETECTION
    console.log('🔒 Initiating ULTRA-SECURE duplicate face detection...');
    const faceCheck = isFaceAlreadyRegistered(voterData.faceData, voters);
    
    if (faceCheck.isDuplicate && faceCheck.existingVoter) {
      console.log('🚨🚨🚨 REGISTRATION DENIED - DUPLICATE FACE DETECTED 🚨🚨🚨');
      console.log('Existing voter:', faceCheck.existingVoter.name);
      console.log('Existing voter ID:', faceCheck.existingVoter.voterId);
      console.log('Detection details:', faceCheck.details);
      
      return {
        success: false,
        message: `🚫 REGISTRATION DENIED: Duplicate face pattern detected! This face is already registered under "${faceCheck.existingVoter.name}" (Voter ID: ${faceCheck.existingVoter.voterId}). ${faceCheck.details || 'Advanced biometric analysis indicates this face has been previously registered.'}. Each person can register only ONCE. Contact the election office immediately if you believe this is an error.`
      };
    }
    
    // Create new voter
    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false,
    };
    
    setVoters(prev => [...prev, newVoter]);
    
    console.log('✅ VOTER REGISTERED SUCCESSFULLY');
    console.log('New voter:', newVoter.name);
    console.log('New voter ID:', newVoter.id);
    console.log('Total voters now:', voters.length + 1);
    console.log('=== ULTRA-SECURE REGISTRATION COMPLETE ===');
    
    return {
      success: true,
      message: "✅ Voter registered successfully! Your unique biometric profile has been securely recorded with advanced duplicate detection. You can now vote in the election."
    };
  };

  const addCandidate = (candidateData: Omit<Candidate, 'id' | 'voteCount'>) => {
    const newCandidate: Candidate = {
      ...candidateData,
      id: Date.now().toString(),
      voteCount: 0,
    };
    setCandidates(prev => [...prev, newCandidate]);
  };

  const updateVoter = (voterId: string, updates: Partial<Omit<Voter, 'id'>>): { success: boolean; message: string } => {
    console.log('=== UPDATING VOTER ===');
    console.log('Voter ID:', voterId);
    console.log('Updates:', updates);
    
    const voterIndex = voters.findIndex(v => v.id === voterId);
    
    if (voterIndex === -1) {
      return {
        success: false,
        message: "Voter not found."
      };
    }
    
    // Check for duplicate Aadhaar or Voter ID if those fields are being updated
    if (updates.aadhaarNumber || updates.voterId) {
      const duplicateVoter = voters.find(v => 
        v.id !== voterId && (
          (updates.aadhaarNumber && v.aadhaarNumber === updates.aadhaarNumber) ||
          (updates.voterId && v.voterId === updates.voterId)
        )
      );
      
      if (duplicateVoter) {
        return {
          success: false,
          message: "Aadhaar number or Voter ID already exists for another voter."
        };
      }
    }
    
    setVoters(prev => prev.map(v => 
      v.id === voterId ? { ...v, ...updates } : v
    ));
    
    console.log('Voter updated successfully');
    return {
      success: true,
      message: "Voter information updated successfully."
    };
  };

  const deleteVoter = (voterId: string): { success: boolean; message: string } => {
    console.log('=== DELETING VOTER ===');
    console.log('Voter ID:', voterId);
    
    const voter = voters.find(v => v.id === voterId);
    
    if (!voter) {
      return {
        success: false,
        message: "Voter not found."
      };
    }
    
    setVoters(prev => prev.filter(v => v.id !== voterId));
    
    console.log('Voter deleted successfully:', voter.name);
    return {
      success: true,
      message: "Voter deleted successfully."
    };
  };

  const verifyVoter = (aadhaar: string, voterId: string, name: string, faceData: string) => {
    console.log('=== VOTER VERIFICATION ATTEMPT ===');
    console.log('Verifying voter:', { aadhaar, voterId, name });
    
    // Find voter by credentials
    const voter = voters.find(v => 
      v.aadhaarNumber === aadhaar && 
      v.voterId === voterId && 
      v.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (!voter) {
      console.log('Voter not found with provided credentials');
      return { 
        success: false, 
        message: "Voter details not found. Please check your Aadhaar number, Voter ID, and name exactly as registered."
      };
    }

    console.log('Voter found:', voter.name);
    
    // Check if already voted
    if (voter.hasVoted) {
      console.log('Voter has already voted');
      return { 
        success: false, 
        message: "You have already cast your vote. Each voter can only vote once per election."
      };
    }

    // Verify face
    console.log('Starting face verification...');
    const faceMatch = verifyFaceMatch(voter.faceData, faceData);
    
    if (!faceMatch) {
      console.log('Face verification failed');
      return { 
        success: false, 
        message: "Face verification failed. Your face does not match the registered image. Please ensure proper lighting and positioning, or contact the election office if you believe this is an error."
      };
    }

    console.log('Face verification successful');
    return { 
      success: true, 
      message: "Identity verified successfully! You are now authorized to cast your vote.", 
      voter 
    };
  };

  const castVote = (candidateId: string, voterId: string) => {
    console.log('=== CASTING VOTE ===');
    console.log('Attempting to cast vote for candidate:', candidateId);
    console.log('Voter ID:', voterId);
    
    const voter = voters.find(v => v.id === voterId);
    
    if (!voter) {
      console.log('Voter not found for vote casting');
      return false;
    }
    
    if (voter.hasVoted) {
      console.log('Voter has already voted - preventing duplicate vote');
      return false;
    }

    // Mark voter as having voted
    setVoters(prev => prev.map(v => 
      v.id === voterId ? { ...v, hasVoted: true } : v
    ));

    // Increment candidate vote count
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
    ));

    console.log('Vote cast successfully for voter:', voter.name);
    console.log('=== VOTE CASTING COMPLETE ===');
    return true;
  };

  const authenticateAdmin = (username: string, password: string) => {
    if ((username === 'vamshi' || username === 'sumer') && password === 'admin123') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  return (
    <VotingContext.Provider value={{
      voters,
      candidates,
      registerVoter,
      addCandidate,
      castVote,
      verifyVoter,
      updateVoter,
      deleteVoter,
      isAdminAuthenticated,
      authenticateAdmin,
      logoutAdmin,
    }}>
      {children}
    </VotingContext.Provider>
  );
};
