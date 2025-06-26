
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

// Enhanced face matching function with better similarity detection
const compareFaceImages = (registeredFaceData: string, currentFaceData: string, isForRegistration: boolean = false): boolean => {
  console.log('Comparing face images...');
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
  
  // Calculate similarity based on base64 data comparison
  const calculateSimilarity = (data1: string, data2: string): number => {
    // If lengths are very different, likely different images
    const lengthRatio = Math.min(data1.length, data2.length) / Math.max(data1.length, data2.length);
    if (lengthRatio < 0.7) {
      console.log('Length ratio too different:', lengthRatio);
      return 0;
    }
    
    // Sample characters at regular intervals for comparison
    const sampleSize = Math.min(1000, Math.min(data1.length, data2.length));
    const step1 = Math.floor(data1.length / sampleSize);
    const step2 = Math.floor(data2.length / sampleSize);
    
    let matches = 0;
    for (let i = 0; i < sampleSize; i++) {
      const char1 = data1[i * step1];
      const char2 = data2[i * step2];
      if (char1 === char2) {
        matches++;
      }
    }
    
    return matches / sampleSize;
  };
  
  const similarity = calculateSimilarity(registeredBase64, currentBase64);
  console.log('Calculated similarity score:', similarity);
  
  // For registration duplicate check, use stricter threshold
  // For voting verification, use more lenient threshold
  const threshold = isForRegistration ? 0.85 : 0.6; // Much stricter for registration
  const isMatch = similarity > threshold;
  
  console.log('Threshold:', threshold);
  console.log('Face match result:', isMatch);
  
  return isMatch;
};

// Function to check if a face is already registered
const checkFaceAlreadyRegistered = (newFaceData: string, existingVoters: Voter[]): boolean => {
  console.log('Checking if face is already registered...');
  console.log('New face data length:', newFaceData.length);
  console.log('Existing voters count:', existingVoters.length);
  
  for (const voter of existingVoters) {
    console.log(`Comparing with voter ${voter.name} (ID: ${voter.id})`);
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
    console.log('Attempting to register new voter:', voterData.name);
    console.log('Registering voter with face data length:', voterData.faceData.length);
    console.log('Registering voter with iris data length:', voterData.irisData.length);
    
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
        message: "This face is already registered with another voter account. Duplicate registrations are not allowed. Please contact support if you believe this is an error."
      };
    }
    
    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false,
    };
    
    setVoters(prev => [...prev, newVoter]);
    console.log('Voter registered successfully:', newVoter.name);
    
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
    console.log('Verifying voter with:', { aadhaar, voterId, name });
    console.log('Received face data length:', faceData.length);
    
    const voter = voters.find(v => 
      v.aadhaarNumber === aadhaar && 
      v.voterId === voterId && 
      v.name.toLowerCase() === name.toLowerCase()
    );

    if (!voter) {
      console.log('Voter not found in database');
      return { success: false, message: "Voter details not found. Please check your information and ensure you are registered." };
    }

    console.log('Voter found, checking if already voted:', voter.hasVoted);
    console.log('Stored face data length:', voter.faceData.length);
    
    if (voter.hasVoted) {
      return { success: false, message: "You have already cast your vote. Multiple voting is not allowed." };
    }

    // Compare the captured face with registered face data (use voting verification threshold)
    console.log('Starting face verification process...');
    const faceMatch = compareFaceImages(voter.faceData, faceData, false); // Pass false for voting verification
    
    if (!faceMatch) {
      console.log('FACE VERIFICATION FAILED - Images do not match');
      return { 
        success: false, 
        message: "Face verification failed. The captured image does not match your registered face data. Please ensure proper lighting and try again. If the issue persists, contact support." 
      };
    }

    console.log('FACE VERIFICATION SUCCESSFUL - Access granted');
    return { success: true, message: "Face verified successfully. You are now authorized to cast your vote.", voter };
  };

  const castVote = (candidateId: string, voterId: string) => {
    const voter = voters.find(v => v.id === voterId);
    if (!voter || voter.hasVoted) return false;

    setVoters(prev => prev.map(v => 
      v.id === voterId ? { ...v, hasVoted: true } : v
    ));

    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
    ));

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
