
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
    
    // EXTREMELY STRICT threshold for duplicate detection during registration
    const MAXIMUM_SECURITY_THRESHOLD = 0.45; // Lowered from 60% to 45% for much stricter detection
    
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
    
    // ADDITIONAL STRICT CHECK: If similarity is above 35%, perform extra validation
    if (similarity >= 0.35) {
      console.log(`⚠️ HIGH SIMILARITY DETECTED: ${(similarity * 100).toFixed(2)}% - Performing additional validation`);
      
      // Check if images are suspiciously similar in size (might be same image)
      const sizeDiff = Math.abs(faceData.length - existingVoter.faceData.length);
      const avgSize = (faceData.length + existingVoter.faceData.length) / 2;
      const sizeVariation = sizeDiff / avgSize;
      
      console.log(`Size variation: ${(sizeVariation * 100).toFixed(2)}%`);
      
      // If size variation is very small AND similarity is high, likely duplicate
      if (sizeVariation < 0.05 && similarity >= 0.40) {
        console.log(`🚨 SUSPECTED DUPLICATE: Low size variation (${(sizeVariation * 100).toFixed(2)}%) + High similarity (${(similarity * 100).toFixed(2)}%)`);
        
        return {
          isDuplicate: true,
          existingVoter,
          similarity,
          details: `Suspected duplicate registration detected. Face pattern ${(similarity * 100).toFixed(1)}% similar with minimal size variation (${(sizeVariation * 100).toFixed(1)}%) to registered voter "${existingVoter.name}" (ID: ${existingVoter.voterId}).`
        };
      }
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
