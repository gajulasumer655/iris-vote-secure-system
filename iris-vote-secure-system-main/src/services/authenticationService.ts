import { Voter } from '../types/voting';
import { validateFaceImageQuality } from '../utils/validation';
import { verifyFaceMatch } from '../utils/faceVerification';

export const verifyVoterService = (
  aadhaar: string,
  voterId: string,
  name: string,
  faceData: string,
  voters: Voter[]
) => {
  console.log('=== MAXIMUM SECURITY VOTER AUTHENTICATION SYSTEM ===');
  console.log('Authentication attempt for:', { aadhaar: aadhaar.substring(0, 4) + '********', voterId, name });
  
  // STEP 1: EXACT CREDENTIAL MATCHING
  console.log('🔍 STEP 1: Performing exact credential verification...');
  
  // Find voter with EXACT matching credentials (case-sensitive name, exact Aadhaar and Voter ID)
  const voter = voters.find(v => 
    v.aadhaarNumber === aadhaar && 
    v.voterId === voterId && 
    v.name === name // Exact case-sensitive match for name
  );

  if (!voter) {
    console.log('❌ AUTHENTICATION FAILED: No voter found with exact matching credentials');
    console.log('Available voters for debugging:');
    voters.forEach((v, index) => {
      console.log(`Voter ${index + 1}: Name="${v.name}", Aadhaar="${v.aadhaarNumber}", VoterID="${v.voterId}"`);
    });
    
    return { 
      success: false, 
      message: "Verification Failed: Voter authentication data mismatch. Please contact the Election Officer."
    };
  }

  console.log('✅ STEP 1 PASSED: Exact credentials verified for voter:', voter.name);
  
  // STEP 2: DUPLICATE VOTING PREVENTION
  console.log('🔍 STEP 2: Checking voting eligibility...');
  
  if (voter.hasVoted) {
    console.log('❌ AUTHENTICATION FAILED: Voter has already cast vote');
    
    // Log security audit entry
    console.log('🚨 SECURITY AUDIT: Duplicate voting attempt detected');
    console.log('Voter:', voter.name);
    console.log('Aadhaar:', aadhaar.substring(0, 4) + '********');
    console.log('Timestamp:', new Date().toISOString());
    
    return { 
      success: false, 
      message: "Verification Failed: You have already cast your vote. Each voter can only vote once per election."
    };
  }

  console.log('✅ STEP 2 PASSED: Voter is eligible to cast vote');
  
  // STEP 3: BIOMETRIC FACE VERIFICATION
  console.log('🔍 STEP 3: Performing biometric face verification...');
  console.log('Registered face data length:', voter.faceData.length);
  console.log('Current face data length:', faceData.length);
  
  // Validate face image quality first
  const faceQuality = validateFaceImageQuality(faceData);
  if (!faceQuality.isValid) {
    console.log('❌ FACE VERIFICATION FAILED: Poor image quality');
    return {
      success: false,
      message: "Verification Failed: Face image quality insufficient. Please ensure proper lighting and clear visibility of your face, then try again."
    };
  }
  
  // Perform enhanced face matching
  const faceMatch = verifyFaceMatch(voter.faceData, faceData);
  
  if (!faceMatch) {
    console.log('🚫 BIOMETRIC VERIFICATION FAILED - ACCESS DENIED');
    
    // Log security audit entry for failed face verification
    console.log('🚨 SECURITY AUDIT: Face verification failed');
    console.log('Voter:', voter.name);
    console.log('Aadhaar:', aadhaar.substring(0, 4) + '********');
    console.log('Timestamp:', new Date().toISOString());
    
    return { 
      success: false, 
      message: "Verification Failed: Voter authentication data mismatch. Please contact the Election Officer."
    };
  }

  console.log('✅ STEP 3 PASSED: Biometric face verification successful');
  
  // STEP 4: FINAL SECURITY VALIDATION
  console.log('🔍 STEP 4: Final security validation...');
  
  // Cross-verify all data points one more time
  const finalValidation = 
    voter.aadhaarNumber === aadhaar &&
    voter.voterId === voterId &&
    voter.name === name &&
    !voter.hasVoted;
  
  if (!finalValidation) {
    console.log('❌ FINAL VALIDATION FAILED: Data integrity check failed');
    return {
      success: false,
      message: "Verification Failed: Data integrity check failed. Please contact the Election Officer."
    };
  }
  
  console.log('✅ STEP 4 PASSED: Final security validation complete');
  
  // Log successful authentication
  console.log('🎯 AUTHENTICATION SUCCESSFUL');
  console.log('🚨 SECURITY AUDIT: Successful voter authentication');
  console.log('Voter:', voter.name);
  console.log('Aadhaar:', aadhaar.substring(0, 4) + '********');
  console.log('Voter ID:', voterId);
  console.log('Authentication method: Exact credential match + Biometric face verification');
  console.log('Timestamp:', new Date().toISOString());
  console.log('=== MAXIMUM SECURITY AUTHENTICATION COMPLETE ===');

  return { 
    success: true, 
    message: "Authentication successful. You are authorized to cast your vote.", 
    voter 
  };
};