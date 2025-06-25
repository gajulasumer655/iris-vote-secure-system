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

// Improved face matching function - handles exact matches and simulated matching
const compareFaceImages = (registeredFaceData: string, currentFaceData: string): boolean => {
  console.log('Comparing face images...');
  console.log('Registered face data length:', registeredFaceData.length);
  console.log('Current face data length:', currentFaceData.length);
  
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
  
  // For demo purposes with different images, simulate face recognition
  // In production, this would use actual facial recognition algorithms
  // For testing, we'll make it more lenient when images are different but valid
  const matchScore = Math.random();
  const threshold = 0.3; // 70% success rate for different but valid images
  const isMatch = matchScore > threshold;
  
  console.log('Face match score:', matchScore);
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
    if (compareFaceImages(voter.faceData, newFaceData)) {
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
    
    // Check if face is already registered
    if (checkFaceAlreadyRegistered(voterData.faceData, voters)) {
      return {
        success: false,
        message: "Face already registered! This face is already associated with another voter registration. Please contact support if you believe this is an error."
      };
    }
    
    // Check for duplicate Aadhaar or Voter ID
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
    
    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false,
    };
    
    setVoters(prev => [...prev, newVoter]);
    console.log('Voter registered successfully:', newVoter.name);
    
    return {
      success: true,
      message: "Voter registered successfully!"
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
      return { success: false, message: "Voter details not found. Please register first." };
    }

    console.log('Voter found, checking if already voted:', voter.hasVoted);
    console.log('Stored face data length:', voter.faceData.length);
    
    if (voter.hasVoted) {
      return { success: false, message: "Vote already cast for this voter." };
    }

    // Compare the captured face with registered face data
    console.log('Starting face verification process...');
    const faceMatch = compareFaceImages(voter.faceData, faceData);
    
    if (!faceMatch) {
      console.log('FACE VERIFICATION FAILED - Images do not match');
      return { success: false, message: "Face verification failed. The captured image does not match your registered face data. Please try again or contact support." };
    }

    console.log('FACE VERIFICATION SUCCESSFUL - Access granted');
    return { success: true, message: "Voter verified successfully.", voter };
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
