import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  voteCount: number;
}

interface Voter {
  id: string;
  name: string;
  aadhaarNumber: string;
  voterId: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  hasVoted: boolean;
  faceCapture?: string;
  irisData?: string;
  faceData?: string;
}

interface VotingContextType {
  // Authentication
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  currentUser: Voter | null;
  
  // Data
  candidates: Candidate[];
  voters: Voter[];
  
  // Authentication methods
  login: (aadhaarNumber: string, voterId: string) => boolean;
  logout: () => void;
  authenticateAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  
  // Candidate management
  addCandidate: (candidate: Omit<Candidate, 'id' | 'voteCount'>) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => { success: boolean; message: string };
  
  // Voter management
  registerVoter: (voter: Omit<Voter, 'id' | 'hasVoted'>) => { success: boolean; message: string };
  updateVoter: (id: string, updates: Partial<Voter>) => { success: boolean; message: string };
  deleteVoter: (id: string) => { success: boolean; message: string };
  verifyVoter: (aadhaarNumber: string, voterId: string, name: string, faceData: string) => { success: boolean; message: string; voter?: Voter };
  
  // Voting
  castVote: (candidateId: string) => { success: boolean; message: string };
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  CANDIDATES: 'voting_candidates',
  VOTERS: 'voting_voters',
  ADMIN_AUTH: 'voting_admin_auth',
  USER_AUTH: 'voting_user_auth',
  CURRENT_USER: 'voting_current_user'
};

// Helper functions for localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const VotingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage
  const [candidates, setCandidates] = useState<Candidate[]>(() => 
    loadFromStorage(STORAGE_KEYS.CANDIDATES, [
      { id: '1', name: 'John Doe', party: 'Democratic Party', symbol: '🔵', voteCount: 0 },
      { id: '2', name: 'Jane Smith', party: 'Republican Party', symbol: '🔴', voteCount: 0 },
      { id: '3', name: 'Bob Johnson', party: 'Independent', symbol: '⭐', voteCount: 0 }
    ])
  );

  const [voters, setVoters] = useState<Voter[]>(() => 
    loadFromStorage(STORAGE_KEYS.VOTERS, [])
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    loadFromStorage(STORAGE_KEYS.USER_AUTH, false)
  );

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => 
    loadFromStorage(STORAGE_KEYS.ADMIN_AUTH, false)
  );

  const [currentUser, setCurrentUser] = useState<Voter | null>(() => 
    loadFromStorage(STORAGE_KEYS.CURRENT_USER, null)
  );

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CANDIDATES, candidates);
  }, [candidates]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VOTERS, voters);
  }, [voters]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_AUTH, isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ADMIN_AUTH, isAdminAuthenticated);
  }, [isAdminAuthenticated]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  const login = (aadhaarNumber: string, voterId: string): boolean => {
    const voter = voters.find(v => v.aadhaarNumber === aadhaarNumber && v.voterId === voterId);
    if (voter) {
      setIsAuthenticated(true);
      setCurrentUser(voter);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const authenticateAdmin = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin123') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  const addCandidate = (candidateData: Omit<Candidate, 'id' | 'voteCount'>) => {
    const newCandidate: Candidate = {
      ...candidateData,
      id: Date.now().toString(),
      voteCount: 0
    };
    setCandidates(prev => [...prev, newCandidate]);
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>): { success: boolean; message: string } => {
    const existingCandidate = candidates.find(c => c.id !== id && 
      (c.name === updates.name || c.party === updates.party || c.symbol === updates.symbol)
    );
    
    if (existingCandidate) {
      return { 
        success: false, 
        message: 'A candidate with this name, party, or symbol already exists.' 
      };
    }

    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === id ? { ...candidate, ...updates } : candidate
      )
    );
    
    return { success: true, message: 'Candidate updated successfully.' };
  };

  const registerVoter = (voterData: Omit<Voter, 'id' | 'hasVoted'>): { success: boolean; message: string } => {
    const existingVoter = voters.find(v => 
      v.aadhaarNumber === voterData.aadhaarNumber || v.voterId === voterData.voterId
    );
    
    if (existingVoter) {
      return { 
        success: false, 
        message: 'A voter with this Aadhaar number or Voter ID already exists.' 
      };
    }

    // Check for duplicate face data
    if (voterData.faceData || voterData.faceCapture) {
      const faceDataToCheck = voterData.faceData || voterData.faceCapture;
      const existingFaceVoter = voters.find(v => 
        v.faceData === faceDataToCheck || v.faceCapture === faceDataToCheck
      );
      
      if (existingFaceVoter) {
        return { 
          success: false, 
          message: 'This face has already been registered. Each face can only be registered once.' 
        };
      }
    }

    const newVoter: Voter = {
      ...voterData,
      id: Date.now().toString(),
      hasVoted: false
    };

    setVoters(prev => [...prev, newVoter]);
    return { success: true, message: 'Voter registered successfully.' };
  };

  const updateVoter = (id: string, updates: Partial<Voter>): { success: boolean; message: string } => {
    const existingVoter = voters.find(v => v.id !== id && 
      (v.aadhaarNumber === updates.aadhaarNumber || v.voterId === updates.voterId)
    );
    
    if (existingVoter) {
      return { 
        success: false, 
        message: 'A voter with this Aadhaar number or Voter ID already exists.' 
      };
    }

    setVoters(prev => 
      prev.map(voter => 
        voter.id === id ? { ...voter, ...updates } : voter
      )
    );

    // Update current user if it's the same voter being updated
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    
    return { success: true, message: 'Voter updated successfully.' };
  };

  const deleteVoter = (id: string): { success: boolean; message: string } => {
    const voter = voters.find(v => v.id === id);
    
    if (!voter) {
      return { success: false, message: 'Voter not found.' };
    }

    if (voter.hasVoted) {
      return { 
        success: false, 
        message: 'Cannot delete a voter who has already cast their vote.' 
      };
    }

    setVoters(prev => prev.filter(v => v.id !== id));
    
    // If the deleted voter is the current user, log them out
    if (currentUser && currentUser.id === id) {
      logout();
    }
    
    return { success: true, message: 'Voter deleted successfully.' };
  };

  const verifyVoter = (aadhaarNumber: string, voterId: string, name: string, faceData: string): { success: boolean; message: string; voter?: Voter } => {
    const voter = voters.find(v => 
      v.aadhaarNumber === aadhaarNumber && 
      v.voterId === voterId && 
      v.name.toLowerCase() === name.toLowerCase()
    );

    if (!voter) {
      return { 
        success: false, 
        message: 'Voter not found. Please check your details.' 
      };
    }

    if (voter.hasVoted) {
      return { 
        success: false, 
        message: 'You have already cast your vote.' 
      };
    }

    // Simple face verification (in real implementation, this would use actual face recognition)
    const storedFaceData = voter.faceData || voter.faceCapture;
    if (!storedFaceData) {
      return { 
        success: false, 
        message: 'No face data found for verification.' 
      };
    }

    // For demo purposes, we'll consider face verification successful
    // In a real system, this would compare the face data using biometric algorithms
    return { 
      success: true, 
      message: 'Face verification successful.', 
      voter 
    };
  };

  const castVote = (candidateId: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to vote.' };
    }

    if (currentUser.hasVoted) {
      return { success: false, message: 'You have already cast your vote.' };
    }

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
      return { success: false, message: 'Invalid candidate selection.' };
    }

    // Update candidate vote count
    setCandidates(prev => 
      prev.map(c => 
        c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
      )
    );

    // Mark voter as having voted
    setVoters(prev => 
      prev.map(v => 
        v.id === currentUser.id ? { ...v, hasVoted: true } : v
      )
    );

    // Update current user
    setCurrentUser(prev => prev ? { ...prev, hasVoted: true } : null);

    return { success: true, message: 'Vote cast successfully!' };
  };

  const value: VotingContextType = {
    isAuthenticated,
    isAdminAuthenticated,
    currentUser,
    candidates,
    voters,
    login,
    logout,
    authenticateAdmin,
    logoutAdmin,
    addCandidate,
    updateCandidate,
    registerVoter,
    updateVoter,
    deleteVoter,
    verifyVoter,
    castVote
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};
