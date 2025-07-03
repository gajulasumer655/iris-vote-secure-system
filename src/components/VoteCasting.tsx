import React, { useState, useRef } from 'react';
import { Vote, Camera, CheckCircle } from 'lucide-react';
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
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const captureAndVerify = () => {
    if (videoRef.current) {
      setVerificationStatus('verifying');
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      
      setFaceCapture(imageData);

      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCapturing(false);

      console.log('🔒 MANDATORY FACE VERIFICATION INITIATED');
      
      // Add a small delay to show verification status
      setTimeout(() => {
        // Verify voter with face matching - MANDATORY CHECK
        const result = verifyVoter(
          loginData.aadhaarNumber,
          loginData.voterId,
          loginData.name,
          imageData
        );

        if (result.success) {
          setVerificationStatus('success');
          console.log('✅ FACE VERIFICATION PASSED - VOTING ACCESS GRANTED');
          
          setTimeout(() => {
            setVerifiedVoter(result.voter);
            setStep('vote');
            toast({
              title: "✅ Face Verified Successfully",
              description: "Identity confirmed. You are authorized to cast your vote.",
            });
          }, 1500);
        } else {
          setVerificationStatus('failed');
          console.log('❌ FACE VERIFICATION FAILED - VOTING ACCESS DENIED');
          
          setTimeout(() => {
            toast({
              title: "❌ Face Verification Failed",
              description: "Face does not match registered data. Please try again or contact Election Officer.",
              variant: "destructive",
            });
            // Reset for retry
            setVerificationStatus('idle');
            setFaceCapture(null);
            setStep('login');
            setLoginData({ name: '', aadhaarNumber: '', voterId: '' });
          }, 2000);
        }
      }, 1000);
    }
  };

  const handleVote = (candidateId: string) => {
    if (verifiedVoter && castVote(candidateId, verifiedVoter.id)) {
      setStep('success');
      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been recorded securely.",
      });
    } else {
      toast({
        title: "Voting Failed",
        description: "Unable to cast vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetVoting = () => {
    setStep('login');
    setLoginData({ name: '', aadhaarNumber: '', voterId: '' });
    setVerifiedVoter(null);
    setFaceCapture(null);
    setVerificationStatus('idle');
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
              <p className="text-green-800">
                <strong>Verified Voter:</strong> {verifiedVoter?.name}
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
              <span>Face Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-800 text-sm">
                <strong>Important:</strong> Your face will be compared with the image captured during registration. 
                Please ensure your face is clearly visible and well-lit for accurate verification.
              </p>
            </div>
            
            <p className="text-lg mb-6">Please capture your face for verification</p>
            
            {/* Verification Status Display */}
            {verificationStatus !== 'idle' && (
              <div className="mb-6">
                {verificationStatus === 'verifying' && (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                      <span className="text-yellow-800 font-semibold">🔒 Verifying Face Pattern...</span>
                    </div>
                  </div>
                )}
                
                {verificationStatus === 'success' && (
                  <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-green-800 font-semibold">✅ Face Verified Successfully!</span>
                    </div>
                  </div>
                )}
                
                {verificationStatus === 'failed' && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✕</span>
                      </div>
                      <span className="text-red-800 font-semibold">❌ Face Does Not Match!</span>
                    </div>
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
                <Button
                  onClick={captureAndVerify}
                  disabled={verificationStatus === 'verifying'}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {verificationStatus === 'verifying' ? 'Verifying...' : 'Capture & Verify Face'}
                </Button>
              </div>
            ) : verificationStatus === 'idle' ? (
              <Button
                onClick={startCamera}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Mandatory Face Verification
              </Button>
            ) : null}
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="voterName">Full Name</Label>
              <Input
                id="voterName"
                value={loginData.name}
                onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-2"
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
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Proceed to Verification
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteCasting;
