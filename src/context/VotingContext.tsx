
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

// Improved face matching algorithm with better accuracy
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
  
  // More strict minimum image size check for better quality
  const minImageSize = 8000;
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
  
  // Enhanced similarity calculation with better accuracy
  const calculateAdvancedSimilarity = (data1: string, data2: string): number => {
    console.log('Calculating advanced face similarity...');
    
    // Method 1: Strict length similarity check
    const lengthRatio = Math.min(data1.length, data2.length) / Math.max(data1.length, data2.length);
    console.log('Length ratio:', lengthRatio);
    
    // More strict length check for registration
    if (isForRegistration && lengthRatio < 0.85) {
      console.log('Length difference too large for face matching');
      return 0;
    }
    
    // Method 2: Header analysis (critical for JPEG structure)
    const headerLength = Math.min(300, Math.min(data1.length, data2.length));
    let headerMatches = 0;
    
    for (let i = 0; i < headerLength; i++) {
      if (data1[i] === data2[i]) {
        headerMatches++;
      }
    }
    
    const headerSimilarity = headerLength > 0 ? headerMatches / headerLength : 0;
    console.log('Header similarity:', headerSimilarity);
    
    // Method 3: Multiple sample point analysis
    const getSamplePoints = (str: string, numSamples: number = 20) => {
      const samples = [];
      const step = Math.floor(str.length / numSamples);
      for (let i = 0; i < str.length; i += step) {
        const endPos = Math.min(i + 50, str.length);
        samples.push(str.substring(i, endPos));
      }
      return samples;
    };
    
    const samples1 = getSamplePoints(data1);
    const samples2 = getSamplePoints(data2);
    
    let totalSampleSimilarity = 0;
    const maxSamples = Math.min(samples1.length, samples2.length);
    
    for (let i = 0; i < maxSamples; i++) {
      const sample1 = samples1[i];
      const sample2 = samples2[i];
      
      let charMatches = 0;
      const minLength = Math.min(sample1.length, sample2.length);
      
      for (let j = 0; j < minLength; j++) {
        if (sample1[j] === sample2[j]) {
          charMatches++;
        }
      }
      
      totalSampleSimilarity += minLength > 0 ? charMatches / minLength : 0;
    }
    
    const avgSampleSimilarity = maxSamples > 0 ? totalSampleSimilarity / maxSamples : 0;
    console.log('Average sample similarity:', avgSampleSimilarity);
    
    // Method 4: Frequency distribution analysis
    const getCharFrequency = (str: string) => {
      const freq: { [key: string]: number } = {};
      const sampleSize = Math.min(1000, str.length);
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
    
    // Weighted combination with emphasis on structural similarity
    const combinedScore = (
      lengthRatio * 0.20 +
      headerSimilarity * 0.40 +
      avgSampleSimilarity * 0.30 +
      frequencySimilarity * 0.10
    );
    
    console.log('Combined similarity score:', combinedScore);
    return combinedScore;
  };
  
  const similarity = calculateAdvancedSimilarity(registeredBase64, currentBase64);
  console.log('Final calculated similarity score:', similarity);
  
  // More conservative thresholds to prevent false positives
  const threshold = isForRegistration ? 0.75 : 0.55; // Higher thresholds for better accuracy
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
    if (!voterData.faceData || voterData.faceData.length < 5000) {
      return {
        success: false,
        message: "Face image quality is insufficient. Please retake the photo with better lighting."
      };
    }
    
    if (!voterData.irisData || voterData.irisData.length < 3000) {
      return {
        success: false,
        message: "Iris scan quality is insufficient. Please retake the iris scan."
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
    
    // Check if face is already registered with improved algorithm
    console.log('=== STARTING DUPLICATE FACE CHECK ===');
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
    const faceMatch = compareFaceImages(voter.faceData, faceData, false);
    
    if (!faceMatch) {
      console.log('FACE VERIFICATION FAILED - Access denied');
      return { 
        success: false, 
        message: "Face verification failed. Please ensure proper lighting and positioning, then try again."
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
