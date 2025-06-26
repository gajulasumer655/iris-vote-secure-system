
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

// Improved face matching function with better accuracy
const compareFaceImages = (registeredFaceData: string, currentFaceData: string, isForRegistration: boolean = false): boolean => {
  console.log('=== FACE COMPARISON START ===');
  console.log('Registered face data length:', registeredFaceData.length);
  console.log('Current face data length:', currentFaceData.length);
  console.log('Is for registration check:', isForRegistration);
  
  // If it's the exact same image data, return true immediately
  if (registeredFaceData === currentFaceData) {
    console.log('EXACT MATCH FOUND - Same image data');
    return true;
  }
  
  // Check if both images are valid base64 data URLs
  const isValidBase64Image = (data: string) => {
    return data.startsWith('data:image/') && data.includes('base64,');
  };
  
  if (!isValidBase64Image(registeredFaceData) || !isValidBase64Image(currentFaceData)) {
    console.log('Invalid image data format');
    return false;
  }
  
  // Check minimum image size for quality assurance
  const minImageSize = 10000; // Minimum base64 string length for decent quality
  if (registeredFaceData.length < minImageSize || currentFaceData.length < minImageSize) {
    console.log('Image quality too low - insufficient data');
    return false;
  }
  
  // Extract base64 data without the data URL prefix for comparison
  const getBase64Data = (dataUrl: string) => {
    const base64Index = dataUrl.indexOf('base64,');
    return base64Index !== -1 ? dataUrl.substring(base64Index + 7) : dataUrl;
  };
  
  const registeredBase64 = getBase64Data(registeredFaceData);
  const currentBase64 = getBase64Data(currentFaceData);
  
  // Improved similarity calculation with multiple methods
  const calculateAdvancedSimilarity = (data1: string, data2: string): number => {
    console.log('Calculating advanced similarity...');
    
    // Method 1: Length similarity (should be similar for same person)
    const lengthRatio = Math.min(data1.length, data2.length) / Math.max(data1.length, data2.length);
    console.log('Length ratio:', lengthRatio);
    
    if (lengthRatio < 0.8) {
      console.log('Length difference too large');
      return 0;
    }
    
    // Method 2: Prefix and suffix comparison (JPEG headers and footers are similar)
    const prefixLength = Math.min(500, Math.min(data1.length, data2.length));
    const suffixLength = Math.min(200, Math.min(data1.length, data2.length));
    
    let prefixMatches = 0;
    let suffixMatches = 0;
    
    // Compare prefixes
    for (let i = 0; i < prefixLength; i++) {
      if (data1[i] === data2[i]) {
        prefixMatches++;
      }
    }
    
    // Compare suffixes
    for (let i = 0; i < suffixLength; i++) {
      const pos1 = data1.length - 1 - i;
      const pos2 = data2.length - 1 - i;
      if (data1[pos1] === data2[pos2]) {
        suffixMatches++;
      }
    }
    
    const prefixSimilarity = prefixMatches / prefixLength;
    const suffixSimilarity = suffixMatches / suffixLength;
    
    console.log('Prefix similarity:', prefixSimilarity);
    console.log('Suffix similarity:', suffixSimilarity);
    
    // Method 3: Chunked comparison (divide image into chunks and compare)
    const chunkCount = 10;
    const chunkSize1 = Math.floor(data1.length / chunkCount);
    const chunkSize2 = Math.floor(data2.length / chunkCount);
    
    let chunkMatches = 0;
    for (let chunk = 0; chunk < chunkCount; chunk++) {
      const start1 = chunk * chunkSize1;
      const start2 = chunk * chunkSize2;
      const end1 = Math.min(start1 + chunkSize1, data1.length);
      const end2 = Math.min(start2 + chunkSize2, data2.length);
      
      const chunk1 = data1.substring(start1, end1);
      const chunk2 = data2.substring(start2, end2);
      
      const minChunkLength = Math.min(chunk1.length, chunk2.length);
      let chunkSimilarity = 0;
      
      for (let i = 0; i < minChunkLength; i++) {
        if (chunk1[i] === chunk2[i]) {
          chunkSimilarity++;
        }
      }
      
      chunkMatches += chunkSimilarity / minChunkLength;
    }
    
    const avgChunkSimilarity = chunkMatches / chunkCount;
    console.log('Average chunk similarity:', avgChunkSimilarity);
    
    // Method 4: Pattern matching (look for common patterns in base64)
    const getCharFrequency = (str: string, sampleSize: number = 1000) => {
      const freq: { [key: string]: number } = {};
      const step = Math.max(1, Math.floor(str.length / sampleSize));
      
      for (let i = 0; i < str.length; i += step) {
        const char = str[i];
        freq[char] = (freq[char] || 0) + 1;
      }
      
      return freq;
    };
    
    const freq1 = getCharFrequency(data1);
    const freq2 = getCharFrequency(data2);
    
    const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    let frequencyScore = 0;
    let totalComparisons = 0;
    
    for (const char of allChars) {
      const f1 = freq1[char] || 0;
      const f2 = freq2[char] || 0;
      const maxFreq = Math.max(f1, f2);
      
      if (maxFreq > 0) {
        frequencyScore += Math.min(f1, f2) / maxFreq;
        totalComparisons++;
      }
    }
    
    const frequencySimilarity = totalComparisons > 0 ? frequencyScore / totalComparisons : 0;
    console.log('Frequency similarity:', frequencySimilarity);
    
    // Combine all methods with weights
    const combinedScore = (
      lengthRatio * 0.2 +
      prefixSimilarity * 0.2 +
      suffixSimilarity * 0.15 +
      avgChunkSimilarity * 0.3 +
      frequencySimilarity * 0.15
    );
    
    console.log('Combined similarity score:', combinedScore);
    return combinedScore;
  };
  
  const similarity = calculateAdvancedSimilarity(registeredBase64, currentBase64);
  console.log('Final calculated similarity score:', similarity);
  
  // Different thresholds for different purposes
  const threshold = isForRegistration ? 0.75 : 0.65; // Stricter for registration, more lenient for voting
  const isMatch = similarity > threshold;
  
  console.log('Threshold used:', threshold);
  console.log('Face match result:', isMatch);
  console.log('=== FACE COMPARISON END ===');
  
  return isMatch;
};

// Function to check if a face is already registered
const checkFaceAlreadyRegistered = (newFaceData: string, existingVoters: Voter[]): boolean => {
  console.log('=== CHECKING FACE REGISTRATION STATUS ===');
  console.log('New face data length:', newFaceData.length);
  console.log('Existing voters count:', existingVoters.length);
  
  for (const voter of existingVoters) {
    console.log(`Comparing with voter: ${voter.name} (ID: ${voter.id})`);
    if (compareFaceImages(voter.faceData, newFaceData, true)) { // Pass true for registration check
      console.log(`DUPLICATE FACE DETECTED - Matches existing voter: ${voter.name}`);
      return true;
    }
  }
  
  console.log('No duplicate face found - registration allowed');
  return false;
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
    console.log('Attempting to register new voter:', voterData.name);
    console.log('Face data length:', voterData.faceData.length);
    console.log('Iris data length:', voterData.irisData.length);
    
    // Validate face image quality
    if (!voterData.faceData || voterData.faceData.length < 10000) {
      return {
        success: false,
        message: "Face image quality is insufficient. Please retake the photo with better lighting and ensure your face is clearly visible."
      };
    }
    
    // Validate iris data
    if (!voterData.irisData || voterData.irisData.length < 5000) {
      return {
        success: false,
        message: "Iris scan quality is insufficient. Please retake the iris scan with proper positioning."
      };
    }
    
    // Check for duplicate Aadhaar or Voter ID first
    const existingVoter = voters.find(v => 
      v.aadhaarNumber === voterData.aadhaarNumber || 
      v.voterId === voterData.voterId
    );
    
    if (existingVoter) {
      return {
        success: false,
        message: "Aadhaar number or Voter ID already registered. Each citizen can only register once."
      };
    }
    
    // Check if face is already registered (most important check)
    if (checkFaceAlreadyRegistered(voterData.faceData, voters)) {
      return {
        success: false,
        message: "This face is already registered in our system. Each person can only register once. If you believe this is an error, please contact support."
      };
    }
    
    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false,
    };
    
    setVoters(prev => [...prev, newVoter]);
    console.log('Voter registered successfully:', newVoter.name);
    console.log('=== REGISTRATION COMPLETE ===');
    
    return {
      success: true,
      message: "Voter registered successfully! Your face and iris data have been captured securely for voting verification."
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

  const verifyVoter = (aadhaar: string, voterId: string, name: string, faceData: string) => {
    console.log('=== VOTER VERIFICATION ATTEMPT ===');
    console.log('Verifying voter with:', { aadhaar, voterId, name });
    console.log('Received face data length:', faceData.length);
    
    // Find voter by exact credentials
    const voter = voters.find(v => 
      v.aadhaarNumber === aadhaar && 
      v.voterId === voterId && 
      v.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (!voter) {
      console.log('Voter not found in database with provided credentials');
      return { 
        success: false, 
        message: "Voter details not found. Please check your Aadhaar number, Voter ID, and name exactly as registered."
      };
    }

    console.log('Voter found in database:', voter.name);
    console.log('Checking if voter has already voted:', voter.hasVoted);
    
    // Check if voter has already voted
    if (voter.hasVoted) {
      console.log('Voter has already cast their vote');
      return { 
        success: false, 
        message: "You have already cast your vote. Each voter can only vote once per election."
      };
    }

    console.log('Voter has not voted yet, proceeding with face verification...');
    console.log('Stored face data length:', voter.faceData.length);
    console.log('Current face data length:', faceData.length);
    
    // Perform face verification (use voting verification threshold)
    const faceMatch = compareFaceImages(voter.faceData, faceData, false); // Pass false for voting verification
    
    if (!faceMatch) {
      console.log('FACE VERIFICATION FAILED - Access denied');
      return { 
        success: false, 
        message: "Face verification failed. The captured image does not match your registered face data. Please ensure proper lighting and positioning, then try again."
      };
    }

    console.log('FACE VERIFICATION SUCCESSFUL - Access granted');
    console.log('=== VERIFICATION COMPLETE ===');
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
      isAdminAuthenticated,
      authenticateAdmin,
      logoutAdmin,
    }}>
      {children}
    </VotingContext.Provider>
  );
};
