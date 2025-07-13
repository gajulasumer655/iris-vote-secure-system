import { Voter } from '../types/voting';
import { validateVoterIdFormat, validateFaceImageQuality } from '../utils/validation';
import { isFaceAlreadyRegistered } from '../utils/duplicateDetection';

export const registerVoterService = (
  voterData: Omit<Voter, 'id' | 'hasVoted'>,
  voters: Voter[]
): { success: boolean; message: string } => {
  console.log('=== MAXIMUM SECURITY VOTER REGISTRATION ATTEMPT ===');
  console.log('Attempting to register voter:', voterData.name);
  console.log('Voter ID:', voterData.voterId);
  console.log('Aadhaar:', voterData.aadhaarNumber);
  console.log('Face data length:', voterData.faceData.length);
  console.log('Current total voters:', voters.length);
  
  // Validate Voter ID format
  if (!validateVoterIdFormat(voterData.voterId)) {
    console.log('❌ Invalid Voter ID format');
    return {
      success: false,
      message: "Invalid Voter ID format. Voter ID must be exactly 10 characters long, start with a letter, and end with a number (e.g., A12345678B)."
    };
  }
  
  // Validate Aadhaar format (12 digits)
  if (!/^\d{12}$/.test(voterData.aadhaarNumber)) {
    console.log('❌ Invalid Aadhaar format');
    return {
      success: false,
      message: "Invalid Aadhaar number. Aadhaar must be exactly 12 digits."
    };
  }
  
  // MAXIMUM SECURITY face data quality validation
  const faceQuality = validateFaceImageQuality(voterData.faceData);
  if (!faceQuality.isValid) {
    console.log('❌ Face image quality insufficient:', faceQuality.details);
    return {
      success: false,
      message: `Face image quality is insufficient for maximum security requirements: ${faceQuality.details}. Please retake the photo with better lighting, higher resolution, and ensure your face is clearly visible and properly positioned.`
    };
  }
  
  if (!voterData.irisData || voterData.irisData.length < 10000) { // Increased from 8000 to 10000
    console.log('❌ Iris scan quality insufficient, length:', voterData.irisData?.length || 0);
    return {
      success: false,
      message: "Iris scan quality is insufficient for maximum security requirements. Please retake the iris scan with better positioning and lighting."
    };
  }
  
  // Check for duplicate Aadhaar number
  const duplicateAadhaar = voters.find(v => v.aadhaarNumber === voterData.aadhaarNumber);
  if (duplicateAadhaar) {
    console.log('❌ Duplicate Aadhaar found:', duplicateAadhaar.name);
    return {
      success: false,
      message: `This Aadhaar number is already registered under the name: ${duplicateAadhaar.name}. Each Aadhaar number can only be used once.`
    };
  }
  
  // Check for duplicate Voter ID
  const duplicateVoterId = voters.find(v => v.voterId === voterData.voterId);
  if (duplicateVoterId) {
    console.log('❌ Duplicate Voter ID found:', duplicateVoterId.name);
    return {
      success: false,
      message: `This Voter ID is already registered under the name: ${duplicateVoterId.name}. Each Voter ID can only be used once.`
    };
  }
  
  // CRITICAL: MAXIMUM SECURITY DUPLICATE FACE DETECTION
  console.log('🔒 Initiating MAXIMUM SECURITY duplicate face detection...');
  const faceCheck = isFaceAlreadyRegistered(voterData.faceData, voters);
  
  if (faceCheck.isDuplicate && faceCheck.existingVoter) {
    console.log('🚨🚨🚨 REGISTRATION DENIED - MAXIMUM SECURITY DUPLICATE FACE DETECTED 🚨🚨🚨');
    console.log('Existing voter:', faceCheck.existingVoter.name);
    console.log('Existing voter ID:', faceCheck.existingVoter.voterId);
    console.log('Detection details:', faceCheck.details);
    
    return {
      success: false,
      message: `🚫 REGISTRATION DENIED BY MAXIMUM SECURITY SYSTEM: Duplicate face pattern detected! This face is already registered under "${faceCheck.existingVoter.name}" (Voter ID: ${faceCheck.existingVoter.voterId}). ${faceCheck.details || 'Ultra-advanced biometric analysis indicates this face has been previously registered.'}. Each person can register only ONCE. Our maximum security system uses ultra-advanced algorithms to prevent fraud. Contact the election office immediately if you believe this is an error.`
    };
  }
  
  console.log('✅ VOTER REGISTERED SUCCESSFULLY WITH MAXIMUM SECURITY');
  console.log('New voter:', voterData.name);
  console.log('Total voters now:', voters.length + 1);
  console.log('=== MAXIMUM SECURITY REGISTRATION COMPLETE ===');
  
  return {
    success: true,
    message: "✅ Voter registered successfully with maximum security! Your unique biometric profile has been securely recorded with ultra-advanced duplicate detection algorithms. You can now vote in the election."
  };
};