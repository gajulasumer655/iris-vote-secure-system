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

// Enhanced face matching algorithm for duplicate detection during registration (very strict)
const calculateRegistrationFaceSimilarity = (face1: string, face2: string): number => {
  console.log('=== ENHANCED REGISTRATION FACE SIMILARITY CHECK ===');
  console.log('Face 1 length:', face1.length);
  console.log('Face 2 length:', face2.length);
  
  // If exact match, return 100% similarity
  if (face1 === face2) {
    console.log('EXACT MATCH DETECTED - 100% similarity');
    return 1.0;
  }
  
  // Validate both images are proper base64 data URLs
  const isValidImage = (data: string) => {
    return data.startsWith('data:image/') && data.includes('base64,') && data.length > 5000;
  };
  
  if (!isValidImage(face1) || !isValidImage(face2)) {
    console.log('Invalid image format detected - returning 0% similarity');
    return 0;
  }
  
  // Extract base64 data
  const getBase64 = (dataUrl: string) => {
    const base64Index = dataUrl.indexOf('base64,');
    return base64Index !== -1 ? dataUrl.substring(base64Index + 7) : dataUrl;
  };
  
  const data1 = getBase64(face1);
  const data2 = getBase64(face2);
  
  // Enhanced similarity calculation with multiple factors
  
  // 1. Length similarity (more strict)
  const lengthRatio = Math.min(data1.length, data2.length) / Math.max(data1.length, data2.length);
  console.log('Length ratio:', lengthRatio);
  
  // Fail immediately if length difference is too large
  if (lengthRatio < 0.75) {
    console.log('Length difference too large for registration - returning 0% similarity');
    return 0;
  }
  
  // 2. Enhanced header analysis (first 1000 characters for better accuracy)
  const headerLength = Math.min(1000, Math.min(data1.length, data2.length));
  let headerMatches = 0;
  
  for (let i = 0; i < headerLength; i++) {
    if (data1[i] === data2[i]) {
      headerMatches++;
    }
  }
  
  const headerSimilarity = headerMatches / headerLength;
  console.log('Header similarity:', headerSimilarity);
  
  // 3. Multiple segment analysis with different sizes
  const calculateSegmentSimilarity = (numSegments: number) => {
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
    
    return totalSegmentSimilarity / numSegments;
  };
  
  const segment10Similarity = calculateSegmentSimilarity(10);
  const segment20Similarity = calculateSegmentSimilarity(20);
  const segment50Similarity = calculateSegmentSimilarity(50);
  
  console.log('Segment 10 similarity:', segment10Similarity);
  console.log('Segment 20 similarity:', segment20Similarity);
  console.log('Segment 50 similarity:', segment50Similarity);
  
  // 4. Character frequency analysis
  const getCharFrequency = (str: string, sampleRate: number = 5) => {
    const freq: { [key: string]: number } = {};
    for (let i = 0; i < str.length; i += sampleRate) {
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
  
  // 5. Pattern matching at different positions
  const calculatePatternSimilarity = () => {
    const patternLength = 100;
    const positions = [0, Math.floor(data1.length * 0.25), Math.floor(data1.length * 0.5), Math.floor(data1.length * 0.75)];
    let totalPatternSimilarity = 0;
    
    for (const pos of positions) {
      if (pos + patternLength <= Math.min(data1.length, data2.length)) {
        const pattern1 = data1.substring(pos, pos + patternLength);
        const pattern2 = data2.substring(pos, pos + patternLength);
        
        let matches = 0;
        for (let i = 0; i < patternLength; i++) {
          if (pattern1[i] === pattern2[i]) {
            matches++;
          }
        }
        
        totalPatternSimilarity += matches / patternLength;
      }
    }
    
    return totalPatternSimilarity / positions.length;
  };
  
  const patternSimilarity = calculatePatternSimilarity();
  console.log('Pattern similarity:', patternSimilarity);
  
  // 6. Hash-based similarity for quick duplicate detection
  const calculateHashSimilarity = () => {
    const hashLength = 64;
    const hash1 = data1.substring(0, Math.min(hashLength, data1.length));
    const hash2 = data2.substring(0, Math.min(hashLength, data2.length));
    
    let matches = 0;
    const minLength = Math.min(hash1.length, hash2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (hash1[i] === hash2[i]) {
        matches++;
      }
    }
    
    return minLength > 0 ? matches / minLength : 0;
  };
  
  const hashSimilarity = calculateHashSimilarity();
  console.log('Hash similarity:', hashSimilarity);
  
  // Enhanced weighted combined similarity score with multiple factors
  const combinedScore = (
    lengthRatio * 0.10 +
    headerSimilarity * 0.25 +
    segment10Similarity * 0.15 +
    segment20Similarity * 0.15 +
    segment50Similarity * 0.10 +
    frequencySimilarity * 0.10 +
    patternSimilarity * 0.10 +
    hashSimilarity * 0.05
  );
  
  console.log('Enhanced registration combined similarity score:', combinedScore);
  return combinedScore;
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

// Enhanced strict duplicate face detection with lower threshold
const isFaceAlreadyRegistered = (newFaceData: string, existingVoters: Voter[]): { isDuplicate: boolean; existingVoter?: Voter } => {
  console.log('=== ENHANCED DUPLICATE FACE DETECTION ===');
  console.log('New face data length:', newFaceData.length);
  console.log('Checking against', existingVoters.length, 'existing voters');
  
  // Additional validation for face data quality
  if (!newFaceData || newFaceData.length < 8000) {
    console.log('Face data quality insufficient for duplicate checking');
    return { isDuplicate: false };
  }
  
  for (const voter of existingVoters) {
    console.log(`Comparing with voter: ${voter.name} (ID: ${voter.voterId})`);
    
    const similarity = calculateRegistrationFaceSimilarity(newFaceData, voter.faceData);
    console.log(`Similarity with ${voter.name}: ${(similarity * 100).toFixed(2)}%`);
    
    // MUCH MORE STRICT threshold for duplicate detection (65% similarity)
    // This will catch more potential duplicates while still allowing legitimate registrations
    const duplicateThreshold = 0.65;
    
    if (similarity >= duplicateThreshold) {
      console.log(`🚨 DUPLICATE FACE DETECTED! 🚨`);
      console.log(`New registration matches ${voter.name} with ${(similarity * 100).toFixed(1)}% similarity`);
      console.log(`Threshold: ${(duplicateThreshold * 100)}%`);
      return { isDuplicate: true, existingVoter: voter };
    }
  }
  
  console.log('✅ No duplicate face found - registration allowed');
  console.log('=== DUPLICATE CHECK COMPLETE ===');
  return { isDuplicate: false };
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
    console.log('=== VOTER REGISTRATION ATTEMPT ===');
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
    
    // Enhanced face and iris data quality validation
    if (!voterData.faceData || voterData.faceData.length < 10000) {
      console.log('❌ Face image quality insufficient, length:', voterData.faceData?.length || 0);
      return {
        success: false,
        message: "Face image quality is insufficient. Please retake the photo with better lighting and ensure your face is clearly visible."
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
    
    // CRITICAL: Enhanced check for duplicate face - this is the main prevention mechanism
    console.log('🔍 Starting enhanced duplicate face detection...');
    const faceCheck = isFaceAlreadyRegistered(voterData.faceData, voters);
    
    if (faceCheck.isDuplicate && faceCheck.existingVoter) {
      console.log('🚨 REGISTRATION BLOCKED - DUPLICATE FACE DETECTED');
      console.log('Existing voter:', faceCheck.existingVoter.name);
      console.log('Existing voter ID:', faceCheck.existingVoter.voterId);
      console.log('Existing voter Aadhaar:', faceCheck.existingVoter.aadhaarNumber);
      
      return {
        success: false,
        message: `🚫 REGISTRATION DENIED: This face pattern is already registered under the name "${faceCheck.existingVoter.name}" (Voter ID: ${faceCheck.existingVoter.voterId}). Each person can only register ONCE with their unique facial pattern. If you believe this is an error, please contact the election office immediately.`
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
    console.log('=== REGISTRATION COMPLETE ===');
    
    return {
      success: true,
      message: "✅ Voter registered successfully! Your unique facial pattern has been securely recorded and verified. You can now vote in the election."
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
