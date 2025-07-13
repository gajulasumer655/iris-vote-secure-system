import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Eye, EyeOff, Scan, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useVoting } from '../context/VotingContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const UserRegistration = () => {
  const { registerVoter } = useVoting();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    aadhaarNumber: '',
    voterId: '',
    address: '',
    phoneNumber: '',
    email: '',
  });
  const [faceCapture, setFaceCapture] = useState<string | null>(null);
  const [irisCapture, setIrisCapture] = useState<string | null>(null);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [isCapturingIris, setIsCapturingIris] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved data on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('voterRegistrationForm');
    const savedFaceCapture = localStorage.getItem('voterFaceCapture');
    const savedIrisCapture = localStorage.getItem('voterIrisCapture');

    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.log('Error loading saved form data:', error);
      }
    }

    if (savedFaceCapture) {
      setFaceCapture(savedFaceCapture);
    }

    if (savedIrisCapture) {
      setIrisCapture(savedIrisCapture);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('voterRegistrationForm', JSON.stringify(formData));
  }, [formData]);

  // Save face capture to localStorage whenever it changes
  useEffect(() => {
    if (faceCapture) {
      localStorage.setItem('voterFaceCapture', faceCapture);
    }
  }, [faceCapture]);

  // Save iris capture to localStorage whenever it changes
  useEffect(() => {
    if (irisCapture) {
      localStorage.setItem('voterIrisCapture', irisCapture);
    }
  }, [irisCapture]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for Voter ID to ensure format compliance
    if (name === 'voterId') {
      // Remove any non-alphanumeric characters and limit to 10 characters
      let cleanedValue = value.replace(/[^A-Za-z0-9]/g, '').substring(0, 10);
      
      setFormData({
        ...formData,
        [name]: cleanedValue.toUpperCase(),
      });
    } else if (name === 'aadhaarNumber') {
      // Only allow digits and limit to 12 characters
      const cleanedValue = value.replace(/\D/g, '').substring(0, 12);
      setFormData({
        ...formData,
        [name]: cleanedValue,
      });
    } else if (name === 'phoneNumber') {
      // Only allow digits and limit to 10 characters
      const cleanedValue = value.replace(/\D/g, '').substring(0, 10);
      setFormData({
        ...formData,
        [name]: cleanedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateVoterIdFormat = (voterId: string): boolean => {
    if (voterId.length !== 10) return false;
    
    const firstChar = voterId.charAt(0);
    const lastChar = voterId.charAt(9);
    
    return /^[A-Za-z]$/.test(firstChar) && /^[0-9]$/.test(lastChar);
  };

  const handleImageImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setFaceCapture(imageData);
        toast({
          title: "Image Imported Successfully",
          description: "Face image has been imported successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startFaceCamera = async () => {
    try {
      setIsCapturingFace(true);
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
      setIsCapturingFace(false);
    }
  };

  const startIrisCamera = async () => {
    try {
      setIsCapturingIris(true);
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
        description: "Unable to access camera for iris scan. Please check permissions.",
        variant: "destructive",
      });
      setIsCapturingIris(false);
    }
  };

  const captureFaceImage = () => {
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
      setIsCapturingFace(false);

      toast({
        title: "Face Capture Successful",
        description: "Face captured successfully. Please review the image quality.",
      });
    }
  };

  const captureIrisImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      setIrisCapture(imageData);

      // Stop camera after capture
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCapturingIris(false);

      toast({
        title: "Iris Capture Successful",
        description: "Iris scan captured successfully. Please review the image quality.",
      });
    }
  };

  const retakeFacePhoto = () => {
    setFaceCapture(null);
    localStorage.removeItem('voterFaceCapture');
    startFaceCamera();
  };

  const retakeIrisPhoto = () => {
    setIrisCapture(null);
    localStorage.removeItem('voterIrisCapture');
    startIrisCamera();
  };

  const clearAllData = () => {
    setFormData({ name: '', aadhaarNumber: '', voterId: '', address: '', phoneNumber: '', email: '' });
    setFaceCapture(null);
    setIrisCapture(null);
    localStorage.removeItem('voterRegistrationForm');
    localStorage.removeItem('voterFaceCapture');
    localStorage.removeItem('voterIrisCapture');
    
    toast({
      title: "Data Cleared",
      description: "All registration data has been cleared.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.name || !formData.aadhaarNumber || !formData.voterId || !formData.address) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate Voter ID format
    if (!validateVoterIdFormat(formData.voterId)) {
      toast({
        title: "Invalid Voter ID Format",
        description: "Voter ID must be exactly 10 characters long, start with a letter, and end with a number (e.g., A12345678B).",
        variant: "destructive",
      });
      return;
    }

    // Validate Aadhaar format
    if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
      toast({
        title: "Invalid Aadhaar Number",
        description: "Aadhaar number must be exactly 12 digits.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number if provided
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits if provided.",
        variant: "destructive",
      });
      return;
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address if provided.",
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

    if (!irisCapture) {
      toast({
        title: "Iris Capture Required",
        description: "Please capture your iris scan for registration.",
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
        // Show success dialog instead of just toast
        setShowSuccessDialog(true);

        // Clear all data after successful registration
        clearAllData();
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
    <>
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6" />
                <span>Voter Registration</span>
              </div>
              <Button
                type="button"
                onClick={clearAllData}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                Clear All Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="mt-2 h-12"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="aadhaarNumber" className="text-sm font-medium">Aadhaar Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="aadhaarNumber"
                      name="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      placeholder="Enter 12-digit Aadhaar number"
                      maxLength={12}
                      className="mt-2 h-12"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be exactly 12 digits</p>
                  </div>

                  <div>
                    <Label htmlFor="voterId" className="text-sm font-medium">Voter ID <span className="text-red-500">*</span></Label>
                    <Input
                      id="voterId"
                      name="voterId"
                      value={formData.voterId}
                      onChange={handleInputChange}
                      placeholder="e.g., A12345678B"
                      maxLength={10}
                      className="mt-2 h-12"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">10 characters: start with letter, end with number</p>
                    {formData.voterId && !validateVoterIdFormat(formData.voterId) && (
                      <p className="text-xs text-red-500 mt-1">
                        Invalid format. Must be 10 characters, start with letter, end with number
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your complete address"
                      className="mt-2 h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number <span className="text-gray-500">(Optional)</span></Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      className="mt-2 h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits if provided</p>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email Address <span className="text-gray-500">(Optional)</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="mt-2 h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">Valid email format if provided</p>
                  </div>
                </div>

                {/* Face Capture */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-center mb-4">Face Capture</h3>
                    
                    {/* Face Capture Guidelines */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">Face Guidelines:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Look directly at the camera</li>
                        <li>• Ensure good lighting on your face</li>
                        <li>• Remove sunglasses or hats</li>
                        <li>• Keep a neutral expression</li>
                        <li>• Position face in the center of frame</li>
                        <li>• <strong>Each face can only be registered once</strong></li>
                      </ul>
                    </div>

                    {isCapturingFace ? (
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
                          onClick={captureFaceImage}
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
                          onClick={retakeFacePhoto}
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Retake Photo
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <Button
                          type="button"
                          onClick={startFaceCamera}
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Start Face Capture
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                          <hr className="flex-1 border-gray-300" />
                          <span className="text-sm text-gray-500">or</span>
                          <hr className="flex-1 border-gray-300" />
                        </div>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageImport}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Face Image
                        </Button>
                        <p className="text-xs text-gray-500">
                          Optional: Import an existing face image (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Iris Capture */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-center mb-4">Iris Scan</h3>
                    
                    {/* Iris Capture Guidelines */}
                    <div className="bg-purple-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-purple-800 mb-2">Iris Guidelines:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Move camera close to your eye</li>
                        <li>• Keep your eye wide open</li>
                        <li>• Hold steady for 3 seconds</li>
                        <li>• Ensure good lighting</li>
                        <li>• Remove contact lenses if possible</li>
                      </ul>
                    </div>

                    {isCapturingIris ? (
                      <div className="space-y-4 text-center">
                        <div className="relative inline-block">
                          <video
                            ref={videoRef}
                            autoPlay
                            className="w-full max-w-sm mx-auto rounded-lg border-4 border-purple-200"
                          />
                          <div className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div className="w-32 h-32 border-2 border-green-400 rounded-full opacity-50"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Position your eye within the circular guide</p>
                        <Button
                          type="button"
                          onClick={captureIrisImage}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Scan className="h-4 w-4 mr-2" />
                          Capture Iris
                        </Button>
                      </div>
                    ) : irisCapture ? (
                      <div className="space-y-4 text-center">
                        <div className="relative inline-block">
                          <img
                            src={irisCapture}
                            alt="Captured iris"
                            className="w-full max-w-sm mx-auto rounded-lg border-4 border-green-200"
                          />
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex items-center text-green-600">
                            <Scan className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Iris Captured</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={retakeIrisPhoto}
                          variant="outline"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                          <Scan className="h-4 w-4 mr-2" />
                          Retake Iris
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Button
                          type="button"
                          onClick={startIrisCamera}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Scan className="h-4 w-4 mr-2" />
                          Start Iris Scan
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Registration Status */}
              <div className="grid md:grid-cols-2 gap-4 mt-8">
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <Label className="text-sm font-medium block mb-2">Face Status</Label>
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

                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <Label className="text-sm font-medium block mb-2">Iris Status</Label>
                  <div className="flex items-center justify-center space-x-2">
                    {irisCapture ? (
                      <>
                        <Scan className="h-5 w-5 text-green-600" />
                        <span className="text-green-600 font-medium">Iris Verified ✓</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-400">Iris Not Captured</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg"
                disabled={!validateVoterIdFormat(formData.voterId) || formData.aadhaarNumber.length !== 12}
              >
                Register Voter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-semibold text-green-800">
              Registration Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              Your voter registration has been completed successfully. You can now participate in the voting process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserRegistration;
