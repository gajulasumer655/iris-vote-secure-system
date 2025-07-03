import { Voter } from '../types/voting';
import { calculateMaximumSecurityFaceSimilarity } from './faceVerification';

// CRITICAL: Check if face is already registered with MAXIMUM SECURITY
export const isFaceAlreadyRegistered = (faceData: string, voters: Voter[]) => {
  console.log('=== MAXIMUM SECURITY DUPLICATE FACE DETECTION ===');
  console.log('Checking face against', voters.length, 'registered voters');
  
  for (let i = 0; i < voters.length; i++) {
    const existingVoter = voters[i];
    console.log(`Checking against voter ${i + 1}: ${existingVoter.name}`);
    
    // Use MAXIMUM SECURITY similarity algorithm
    const similarity = calculateMaximumSecurityFaceSimilarity(faceData, existingVoter.faceData);
    
    console.log(`Similarity with ${existingVoter.name}: ${(similarity * 100).toFixed(2)}%`);
    
    // ULTRA-STRICT threshold for duplicate detection during registration
    const MAXIMUM_SECURITY_THRESHOLD = 0.75; // 75% similarity = DUPLICATE for registration
    
    if (similarity >= MAXIMUM_SECURITY_THRESHOLD) {
      console.log(`🚨 DUPLICATE FACE DETECTED! Similarity: ${(similarity * 100).toFixed(2)}% >= ${(MAXIMUM_SECURITY_THRESHOLD * 100)}%`);
      console.log('Existing voter:', existingVoter.name);
      console.log('Existing voter ID:', existingVoter.voterId);
      
      return {
        isDuplicate: true,
        existingVoter,
        similarity,
        details: `Face pattern ${(similarity * 100).toFixed(1)}% similar to registered voter "${existingVoter.name}" (ID: ${existingVoter.voterId}). Maximum security threshold: ${(MAXIMUM_SECURITY_THRESHOLD * 100)}%.`
      };
    }
  }
  
  console.log('✅ No duplicate face found - Registration can proceed');
  return {
    isDuplicate: false,
    existingVoter: null,
    similarity: 0,
    details: 'No similar face patterns detected in database'
  };
};