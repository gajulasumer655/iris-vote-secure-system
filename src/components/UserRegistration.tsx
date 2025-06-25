import React, { useState, useRef } from 'react';
import { Camera, User, CreditCard, MapPin, Eye } from 'lucide-react';
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
  const [irisCapture, setIrisCapture] = useState<string | null>(null);
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

  const captureImage = (type: 'face' | 'iris') => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      
      if (type === 'face') {
        setFaceCapture(imageData);
      } else {
        setIrisCapture(imageData);
      }

      // Stop camera after capture
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCapturing(false);

      toast({
        title: "Capture Successful",
        description: `${type === 'face' ? 'Face' : 'Iris'} pattern captured successfully.`,
      });
    }
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

    if (!faceCapture || !irisCapture) {
      toast({
        title: "Biometric Data Required",
        description: "Please capture both face and iris patterns.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = registerVoter({
        ...formData,
        faceData: faceCapture,
        irisData: irisCapture,
      });

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: result.message,
        });

        // Reset form
        setFormData({ name: '', aadhaarNumber: '', voterId: '', address: '' });
        setFaceCapture(null);
        setIrisCapture(null);
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {isCapturing ? (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        className="w-full max-w-sm mx-auto rounded-lg"
                      />
                      <div className="space-x-2">
                        <Button
                          type="button"
                          onClick={() => captureImage('face')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Face
                        </Button>
                        <Button
                          type="button"
                          onClick={() => captureImage('iris')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Capture Iris
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label className="text-sm font-medium">Face Pattern</Label>
                    <div className="mt-2 border-2 border-gray-200 rounded-lg p-2 h-24 flex items-center justify-center">
                      {faceCapture ? (
                        <span className="text-green-600 text-sm">✓ Captured</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not captured</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-medium">Iris Pattern</Label>
                    <div className="mt-2 border-2 border-gray-200 rounded-lg p-2 h-24 flex items-center justify-center">
                      {irisCapture ? (
                        <span className="text-green-600 text-sm">✓ Captured</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not captured</span>
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
