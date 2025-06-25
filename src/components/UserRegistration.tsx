
import React, { useState, useRef } from 'react';
import { Camera, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useVoting } from '../context/VotingContext';

const UserRegistration = () => {
  const { registerVoter } = useVoting();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    aadhaarNumber: '',
    voterId: '',
    address: '',
  });
  const [faceCapture, setFaceCapture] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      setFaceCapture(imageData);

      // Stop camera after capture
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCapturing(false);

      toast({
        title: "Capture Successful",
        description: "Face captured successfully. Please review the image quality.",
      });
    }
  };

  const retakePhoto = () => {
    setFaceCapture(null);
    startCamera();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.aadhaarNumber || !formData.voterId || !formData.address) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!faceCapture) {
      toast({
        title: "Face Capture Required",
        description: "Please capture your face image for registration.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = registerVoter({
        ...formData,
        faceData: faceCapture,
        irisData: '', // Remove iris data requirement
      });

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: result.message,
        });

        // Reset form
        setFormData({ name: '', aadhaarNumber: '', voterId: '', address: '' });
        setFaceCapture(null);
      } else {
        toast({
          title: "Registration Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center space-x-2 text-2xl">
            <User className="h-6 w-6" />
            <span>Voter Registration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-lg font-medium">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="mt-2 h-12"
                  />
                </div>
                
                <div>
                  <Label htmlFor="aadhaarNumber" className="text-lg font-medium">Aadhaar Number</Label>
                  <Input
                    id="aadhaarNumber"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                    className="mt-2 h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="voterId" className="text-lg font-medium">Voter ID</Label>
                  <Input
                    id="voterId"
                    name="voterId"
                    value={formData.voterId}
                    onChange={handleInputChange}
                    placeholder="Enter your Voter ID"
                    className="mt-2 h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-lg font-medium">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your complete address"
                    className="mt-2 h-12"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-center mb-4">Face Capture</h3>
                  
                  {/* Face Capture Guidelines */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">Photography Guidelines:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Look directly at the camera</li>
                      <li>• Ensure good lighting on your face</li>
                      <li>• Remove sunglasses or hats</li>
                      <li>• Keep a neutral expression</li>
                      <li>• Position face in the center of frame</li>
                    </ul>
                  </div>

                  {isCapturing ? (
                    <div className="space-y-4 text-center">
                      <div className="relative inline-block">
                        <video
                          ref={videoRef}
                          autoPlay
                          className="w-full max-w-sm mx-auto rounded-lg border-4 border-blue-200"
                        />
                        <div className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-48 h-64 border-2 border-green-400 rounded-full opacity-50"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">Position your face within the oval guide</p>
                      <Button
                        type="button"
                        onClick={captureImage}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Face
                      </Button>
                    </div>
                  ) : faceCapture ? (
                    <div className="space-y-4 text-center">
                      <div className="relative inline-block">
                        <img
                          src={faceCapture}
                          alt="Captured face"
                          className="w-full max-w-sm mx-auto rounded-lg border-4 border-green-200"
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex items-center text-green-600">
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Face Captured</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={retakePhoto}
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Retake Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        type="button"
                        onClick={startCamera}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Face Capture
                      </Button>
                    </div>
                  )}
                </div>

                {/* Face Capture Status */}
                <div className="text-center">
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <Label className="text-sm font-medium block mb-2">Registration Status</Label>
                    <div className="flex items-center justify-center space-x-2">
                      {faceCapture ? (
                        <>
                          <Eye className="h-5 w-5 text-green-600" />
                          <span className="text-green-600 font-medium">Face Verified ✓</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-400">Face Not Captured</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg"
            >
              Register Voter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRegistration;
