
import React, { useState, useRef } from 'react';
import { Vote, Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useVoting } from '../context/VotingContext';

const VoteCasting = () => {
  const { verifyVoter, castVote, candidates } = useVoting();
  const { toast } = useToast();
  const [step, setStep] = useState<'login' | 'verify' | 'vote' | 'success'>('login');
  const [loginData, setLoginData] = useState({
    name: '',
    aadhaarNumber: '',
    voterId: '',
  });
  const [verifiedVoter, setVerifiedVoter] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceCapture, setFaceCapture] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.name || !loginData.aadhaarNumber || !loginData.voterId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setStep('verify');
    setVerificationAttempts(0);
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions and try again.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const captureAndVerify = () => {
    if (!videoRef.current) {
      toast({
        title: "Camera Error",
        description: "Camera not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setVerificationStatus('verifying');
    setVerificationAttempts(prev => prev + 1);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }
      
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Validate captured image
      if (!imageData || imageData.length < 10000) {
        throw new Error('Captured image is too small or invalid');
      }
      
      setFaceCapture(imageData);
      stopCamera();

      console.log('🔒 MANDATORY FACE VERIFICATION INITIATED');
      console.log('Verification attempt:', verificationAttempts + 1);
      console.log('Captured image size:', imageData.length);
      
      // Add delay to show verification process
      setTimeout(() => {
        try {
          // CRITICAL: Verify voter with STRICT face matching
          const result = verifyVoter(
            loginData.aadhaarNumber,
            loginData.voterId,
            loginData.name,
            imageData
          );

          console.log('Verification result:', result);

          if (result.success && result.voter) {
            setVerificationStatus('success');
            console.log('✅ FACE VERIFICATION PASSED - VOTING ACCESS GRANTED');
            
            setTimeout(() => {
              setVerifiedVoter(result.voter);
              setStep('vote');
              toast({
                title: "✅ Face Verified Successfully",
                description: `Identity confirmed for ${result.voter.name}. You are authorized to cast your vote.`,
              });
            }, 1500);
          } else {
            setVerificationStatus('failed');
            console.log('❌ FACE VERIFICATION FAILED - VOTING ACCESS DENIED');
            console.log('Failure reason:', result.message);
            
            setTimeout(() => {
              const errorMessage = result.message || "Face verification failed. Please ensure your face is clearly visible and matches your registration photo.";
              
              toast({
                title: "❌ Face Verification Failed",
                description: errorMessage,
                variant: "destructive",
              });
              
              // Allow retry but limit attempts
              if (verificationAttempts >= 3) {
                toast({
                  title: "Maximum Attempts Reached",
                  description: "Too many failed attempts. Please contact Election Officer for assistance.",
                  variant: "destructive",
                });
                setTimeout(() => {
                  resetVoting();
                }, 3000);
              } else {
                setVerificationStatus('idle');
                setFaceCapture(null);
              }
            }, 2000);
          }
        } catch (error) {
          console.error('Verification error:', error);
          setVerificationStatus('failed');
          
          setTimeout(() => {
            toast({
              title: "Verification Error",
              description: "An error occurred during verification. Please try again.",
              variant: "destructive",
            });
            setVerificationStatus('idle');
            setFaceCapture(null);
          }, 2000);
        }
      }, 1000);
    } catch (error) {
      console.error('Capture error:', error);
      setVerificationStatus('failed');
      
      toast({
        title: "Capture Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setVerificationStatus('idle');
        setFaceCapture(null);
      }, 2000);
    }
  };

  const handleVote = (candidateId: string) => {
    // CRITICAL: Double-check voter verification before allowing vote
    if (!verifiedVoter) {
      console.error('❌ CRITICAL SECURITY VIOLATION: Attempt to vote without verified voter');
      toast({
        title: "Security Error",
        description: "Voter verification required. Please complete face verification first.",
        variant: "destructive",
      });
      setStep('verify');
      return;
    }

    // Additional security check
    if (verificationStatus !== 'success') {
      console.error('❌ CRITICAL SECURITY VIOLATION: Attempt to vote without successful verification');
      toast({
        title: "Verification Required",
        description: "Face verification must be completed successfully before voting.",
        variant: "destructive",
      });
      setStep('verify');
      return;
    }

    console.log('🗳️ Attempting to cast vote with verified voter:', verifiedVoter.name);
    
    if (castVote(candidateId, verifiedVoter.id)) {
      setStep('success');
      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been recorded securely and anonymously.",
      });
      console.log('✅ Vote cast successfully for verified voter:', verifiedVoter.name);
    } else {
      toast({
        title: "Voting Failed",
        description: "Unable to cast vote. You may have already voted or there was an error.",
        variant: "destructive",
      });
      console.log('❌ Vote casting failed for voter:', verifiedVoter.name);
    }
  };

  const resetVoting = () => {
    setStep('login');
    setLoginData({ name: '', aadhaarNumber: '', voterId: '' });
    setVerifiedVoter(null);
    setFaceCapture(null);
    setVerificationStatus('idle');
    setVerificationAttempts(0);
    stopCamera();
  };

  const retryVerification = () => {
    setVerificationStatus('idle');
    setFaceCapture(null);
    stopCamera();
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border-0 bg-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Vote Cast Successfully!</h2>
            <p className="text-green-600 mb-6">Your vote has been recorded securely and anonymously.</p>
            <Button onClick={resetVoting} className="bg-blue-600 hover:bg-blue-700">
              Cast Another Vote
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'vote') {
    // CRITICAL: Additional security check before rendering vote interface
    if (!verifiedVoter || verificationStatus !== 'success') {
      console.error('❌ CRITICAL: Unauthorized access to voting interface');
      setStep('verify');
      return null;
    }

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Vote className="h-6 w-6" />
              <span>Cast Your Vote</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800">
                  <strong>✅ Verified Voter:</strong> {verifiedVoter?.name}
                </p>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Face verification completed successfully
              </p>
            </div>
            
            <h3 className="text-xl font-bold mb-6">Select Your Candidate:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-500"
                  onClick={() => handleVote(candidate.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4">{candidate.symbol}</div>
                    <h3 className="text-xl font-bold mb-2">{candidate.name}</h3>
                    <p className="text-gray-600">{candidate.party}</p>
                    <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                      Vote for {candidate.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Camera className="h-6 w-6" />
              <span>Mandatory Face Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
                <p className="text-purple-800 font-semibold">MANDATORY SECURITY VERIFICATION</p>
              </div>
              <p className="text-purple-700 text-sm">
                Your face will be compared with the image captured during registration. 
                Face verification is required before voting access is granted.
              </p>
              {verificationAttempts > 0 && (
                <p className="text-purple-600 text-sm mt-2">
                  Attempt {verificationAttempts} of 3
                </p>
              )}
            </div>
            
            <p className="text-lg mb-6 font-medium">Capture your face for mandatory verification</p>
            
            {/* Verification Status Display */}
            {verificationStatus !== 'idle' && (
              <div className="mb-6">
                {verificationStatus === 'verifying' && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                      <span className="text-yellow-800 font-semibold">🔒 Verifying Face Pattern...</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-2">Please wait while we verify your identity</p>
                  </div>
                )}
                
                {verificationStatus === 'success' && (
                  <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-green-800 font-semibold">✅ Face Verified Successfully!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-2">Redirecting to voting interface...</p>
                  </div>
                )}
                
                {verificationStatus === 'failed' && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <span className="text-red-800 font-semibold">❌ Face Verification Failed!</span>
                    </div>
                    <p className="text-red-700 text-sm mt-2">
                      Face does not match registration data. Please try again.
                    </p>
                    {verificationAttempts < 3 && (
                      <Button 
                        onClick={retryVerification}
                        className="mt-3 bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {isCapturing ? (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    className={`w-full max-w-md mx-auto rounded-lg border-4 ${
                      verificationStatus === 'success' ? 'border-green-500' :
                      verificationStatus === 'failed' ? 'border-red-500' :
                      'border-purple-200'
                    }`}
                  />
                  {verificationStatus === 'verifying' && (
                    <div className="absolute inset-0 bg-yellow-100 bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="bg-white p-3 rounded-full shadow-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-x-4">
                  <Button
                    onClick={captureAndVerify}
                    disabled={verificationStatus === 'verifying'}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {verificationStatus === 'verifying' ? 'Verifying...' : 'Capture & Verify Face'}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    disabled={verificationStatus === 'verifying'}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : verificationStatus === 'idle' ? (
              <Button
                onClick={startCamera}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={verificationAttempts >= 3}
              >
                <Camera className="h-4 w-4 mr-2" />
                {verificationAttempts >= 3 ? 'Maximum Attempts Reached' : 'Start Mandatory Face Verification'}
              </Button>
            ) : null}
            
            {verificationAttempts >= 3 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  Maximum verification attempts reached. Please contact Election Officer for assistance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center space-x-2 text-2xl">
            <Vote className="h-6 w-6" />
            <span>Voter Login</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Security Notice:</strong> Face verification is mandatory before voting access is granted.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="voterName">Full Name</Label>
              <Input
                id="voterName"
                value={loginData.name}
                onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="voterAadhaar">Aadhaar Number</Label>
              <Input
                id="voterAadhaar"
                value={loginData.aadhaarNumber}
                onChange={(e) => setLoginData({ ...loginData, aadhaarNumber: e.target.value })}
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="voterIdInput">Voter ID</Label>
              <Input
                id="voterIdInput"
                value={loginData.voterId}
                onChange={(e) => setLoginData({ ...loginData, voterId: e.target.value })}
                placeholder="Enter your Voter ID"
                className="mt-2"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Proceed to Face Verification
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteCasting;
