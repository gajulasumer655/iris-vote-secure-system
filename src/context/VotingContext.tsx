import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Voter, Candidate, VotingContextType } from '../types/voting';
import { registerVoterService } from '../services/voterService';
import { verifyVoterService } from '../services/authenticationService';

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};

export const VotingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: '1', name: 'John Smith', party: 'Democratic Party', symbol: '🔵', voteCount: 0 },
    { id: '2', name: 'Sarah Johnson', party: 'Republican Party', symbol: '🔴', voteCount: 0 },
  ]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const registerVoter = (voterData: Omit<Voter, 'id' | 'hasVoted'>): { success: boolean; message: string } => {
    const result = registerVoterService(voterData, voters);
    
    if (result.success) {
      const newVoter: Voter = {
        ...voterData,
        id: Date.now().toString(),
        hasVoted: false,
      };
      setVoters(prev => [...prev, newVoter]);
    }
    
    return result;
  };

  const addCandidate = (candidateData: Omit<Candidate, 'id' | 'voteCount'>) => {
    const newCandidate: Candidate = {
      ...candidateData,
      id: Date.now().toString(),
      voteCount: 0,
    };
    setCandidates(prev => [...prev, newCandidate]);
  };

  const updateCandidate = (candidateId: string, updates: Omit<Candidate, 'id' | 'voteCount'>): { success: boolean; message: string } => {
    console.log('=== UPDATING CANDIDATE ===');
    console.log('Candidate ID:', candidateId);
    console.log('Updates:', updates);
    
    const candidateIndex = candidates.findIndex(c => c.id === candidateId);
    
    if (candidateIndex === -1) {
      return {
        success: false,
        message: "Candidate not found."
      };
    }
    
    // Check for duplicate candidate names or symbols (excluding the current candidate)
    const duplicateCandidate = candidates.find(c => 
      c.id !== candidateId && (
        c.name.toLowerCase().trim() === updates.name.toLowerCase().trim() ||
        c.symbol === updates.symbol
      )
    );
    
    if (duplicateCandidate) {
      return {
        success: false,
        message: "Candidate name or symbol already exists for another candidate."
      };
    }
    
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, ...updates } : c
    ));
    
    console.log('Candidate updated successfully');
    return {
      success: true,
      message: "Candidate information updated successfully."
    };
  };

  const updateVoter = (voterId: string, updates: Partial<Omit<Voter, 'id'>>) => {
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
    return verifyVoterService(aadhaar, voterId, name, faceData, voters);
  };

  const castVote = (candidateId: string, voterId: string) => {
    console.log('=== CASTING VOTE ===');
    console.log('Attempting to cast vote for candidate:', candidateId);
    console.log('Voter ID:', voterId);
    
    const voter = voters.find(v => v.id === voterId);
    
    if (!voter) {
      console.log('❌ Voter not found for vote casting');
      return false;
    }
    
    if (voter.hasVoted) {
      console.log('❌ Voter has already voted - preventing duplicate vote');
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

    console.log('✅ Vote cast successfully for voter:', voter.name);
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
      updateCandidate,
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