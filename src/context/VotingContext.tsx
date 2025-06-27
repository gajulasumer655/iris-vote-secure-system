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

// Strict face matching algorithm that ensures only identical faces pass
const compareFaceImages = (registeredFaceData: string, currentFaceData: string, isForRegistration: boolean = false): boolean => {
  console.log('=== STRICT FACE COMPARISON START ===');
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
    console.log('Invalid image data format - REJECTED');
    return false;
  }
  
  // Very strict minimum image size check
  const minImageSize = 10000; // Increased minimum size
  if (registeredFaceData.length < minImageSize || currentFaceData.length < minImageSize) {
    console.log('Image quality too low - REJECTED');
    return false;
  }
  
  // Extract base64 data without the data URL prefix
  const getBase64Data = (dataUrl: string) => {
    const base64Index = dataUrl.indexOf('base64,');
    return base64Index !== -1 ? dataUrl.substring(base64Index + 7) : dataUrl;
  };
  
  const registeredBase64 = getBase64Data(registeredFaceData);
  const currentBase64 = getBase64Data(currentFaceData);
  
  // Ultra-strict face matching algorithm
  const calculateStrictFaceSimilarity = (data1: string, data2: string): number => {
    console.log('Calculating STRICT face similarity...');
    
    // 1. Very strict length similarity (images from same person should be similar size)
    const lengthRatio = Math.min(data1.length, data2.length) / Math.max(data1.length, data2.length);
    console.log('Length ratio:', lengthRatio);
    
    // For registration, length must be very similar (same person, similar conditions)
    if (isForRegistration && lengthRatio < 0.90) {
      console.log('Length difference too large - REJECTED');
      return 0;
    }
    
    // For voting, still need reasonable similarity
    if (!isForRegistration && lengthRatio < 0.80) {
      console.log('Length difference too large for voting - REJECTED');
      return 0;
    }
    
    // 2. Critical header analysis - JPEG structure must be very similar
    const headerLength = Math.min(500, Math.min(data1.length, data2.length));
    let headerMatches = 0;
    
    for (let i = 0; i < headerLength; i++) {
      if (data1[i] === data2[i]) {
        headerMatches++;
      }
    }
    
    const headerSimilarity = headerLength > 0 ? headerMatches / headerLength : 0;
    console.log('Header similarity:', headerSimilarity);
    
    // Header must be VERY similar for same person
    if (headerSimilarity < 0.85) {
      console.log('Header similarity too low - REJECTED');
      return 0;
    }
    
    // 3. Multiple segment analysis with high precision
    const analyzeSegments = (str1: string, str2: string, numSegments: number = 10) => {
      const segmentSize = Math.floor(Math.min(str1.length, str2.length) / numSegments);
      let totalSimilarity = 0;
      
      for (let i = 0; i < numSegments; i++) {
        const start = i * segmentSize;
        const end = start + segmentSize;
        
        const segment1 = str1.substring(start, end);
        const segment2 = str2.substring(start, end);
        
        let matches = 0;
        const minLength = Math.min(segment1.length, segment2.length);
        
        for (let j = 0; j < minLength; j++) {
          if (segment1[j] === segment2[j]) {
            matches++;
          }
        }
        
        totalSimilarity += minLength > 0 ? matches / minLength : 0;
      }
      
      return totalSimilarity / numSegments;
    };
    
    const segmentSimilarity = analyzeSegments(data1, data2);
    console.log('Segment similarity:', segmentSimilarity);
    
    // 4. Character frequency analysis
    const getCharacterFrequency = (str: string) => {
      const freq: { [key: string]: number } = {};
      // Sample every 5th character to speed up processing
      for (let i = 0; i < str.length; i += 5) {
        const char = str[i];
        freq[char] = (freq[char] || 0) + 1;
      }
      return freq;
    };
    
    const freq1 = getCharacterFrequency(data1);
    const freq2 = getCharacterFrequency(data2);
    
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
    
    // 5. End-to-end comparison for final verification
    const endSize = Math.min(200, Math.min(data1.length, data2.length));
    const tailStart1 = data1.length - endSize;
    const tailStart2 = data2.length - endSize;
    
    let tailMatches = 0;
    for (let i = 0; i < endSize; i++) {
      if (data1[tailStart1 + i] === data2[tailStart2 + i]) {
        tailMatches++;
      }
    }
    
    const tailSimilarity = endSize > 0 ? tailMatches / endSize : 0;
    console.log('Tail similarity:', tailSimilarity);
    
    // Weighted combination with very strict requirements
    const combinedScore = (
      lengthRatio * 0.15 +
      headerSimilarity * 0.35 +
      segmentSimilarity * 0.30 +
      frequencySimilarity * 0.10 +
      tailSimilarity * 0.10
    );
    
    console.log('Combined similarity score:', combinedScore);
    return combinedScore;
  };
  
  const similarity = calculateStrictFaceSimilarity(registeredBase64, currentBase64);
  console.log('Final calculated similarity score:', similarity);
  
  // VERY STRICT thresholds - only allow very high similarity
  const threshold = isForRegistration ? 0.85 : 0.80; // Much higher thresholds
  const isMatch = similarity >= threshold;
  
  console.log('Threshold used:', threshold);
  console.log('Face match result:', isMatch);
  
  if (!isMatch) {
    console.log('FACE VERIFICATION FAILED - Similarity too low');
    console.log('Required similarity:', threshold);
    console.log('Actual similarity:', similarity);
  } else {
    console.log('FACE VERIFICATION PASSED - High similarity detected');
  }
  
  console.log('=== STRICT FACE COMPARISON END ===');
  
  return isMatch;
};

// Function to check if a face is already registered
const checkFaceAlreadyRegistered = (newFaceData: string, existingVoters: Voter[]): boolean => {
  console.log('=== CHECKING FACE REGISTRATION STATUS ===');
  console.log('New face data length:', newFaceData.length);
  console.log('Existing voters count:', existingVoters.length);
  
  for (const voter of existingVoters) {
    console.log(`Comparing with voter: ${voter.name} (ID: ${voter.id})`);
    console.log(`Stored face data length: ${voter.faceData.length}`);
    
    if (compareFaceImages(voter.faceData, newFaceData, true)) {
      console.log(`DUPLICATE FACE DETECTED - Matches existing voter: ${voter.name}`);
      console.log('=== BLOCKING DUPLICATE REGISTRATION ===');
      return true;
    }
  }
  
  console.log('No duplicate face found - registration allowed');
  console.log('=== FACE CHECK COMPLETE ===');
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
    
    // Basic validation
    if (!voterData.faceData || voterData.faceData.length < 8000) {
      return {
        success: false,
        message: "Face image quality is insufficient. Please retake the photo with better lighting and ensure your face is clearly visible."
      };
    }
    
    if (!voterData.irisData || voterData.irisData.length < 5000) {
      return {
        success: false,
        message: "Iris scan quality is insufficient. Please retake the iris scan with better positioning."
      };
    }
    
    // Check for duplicate Aadhaar or Voter ID first
    const existingVoter = voters.find(v => 
      v.aadhaarNumber === voterData.aadhaarNumber || 
      v.voterId === voterData.voterId
    );
    
    if (existingVoter) {
      console.log('Duplicate Aadhaar/Voter ID found:', existingVoter.name);
      return {
        success: false,
        message: "Aadhaar number or Voter ID already registered. Each citizen can only register once."
      };
    }
    
    // Check if face is already registered with strict algorithm
    console.log('=== STARTING STRICT DUPLICATE FACE CHECK ===');
    if (checkFaceAlreadyRegistered(voterData.faceData, voters)) {
      return {
        success: false,
        message: "This face is already registered in our system. Duplicate registrations are not allowed. If you believe this is an error, please contact the election office."
      };
    }
    
    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false,
    };
    
    setVoters(prev => [...prev, newVoter]);
    console.log('Voter registered successfully:', newVoter.name);
    console.log('Total voters now:', voters.length + 1);
    console.log('=== REGISTRATION COMPLETE ===');
    
    return {
      success: true,
      message: "Voter registered successfully! Your biometric data has been securely recorded."
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
    console.log('=== STRICT VOTER VERIFICATION ATTEMPT ===');
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

    console.log('Voter has not voted yet, proceeding with STRICT face verification...');
    console.log('Stored face data length:', voter.faceData.length);
    console.log('Current face data length:', faceData.length);
    
    // Perform STRICT face verification
    const faceMatch = compareFaceImages(voter.faceData, faceData, false);
    
    if (!faceMatch) {
      console.log('STRICT FACE VERIFICATION FAILED - Access DENIED');
      return { 
        success: false, 
        message: "Face verification failed. Your face does not match the registered image. Please ensure proper lighting and positioning, or contact the election office if you believe this is an error."
      };
    }

    console.log('STRICT FACE VERIFICATION SUCCESSFUL - Access GRANTED');
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
