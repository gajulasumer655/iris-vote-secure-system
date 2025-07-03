import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ManualVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  voterData: {
    name: string;
    aadhaarNumber: string;
    voterId: string;
  };
}

const ManualVerificationModal = ({ isOpen, onClose, voterData }: ManualVerificationModalProps) => {
  const [remarks, setRemarks] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== MANUAL VERIFICATION REQUEST SUBMITTED ===');
    console.log('Voter:', voterData.name);
    console.log('Aadhaar:', voterData.aadhaarNumber);
    console.log('Voter ID:', voterData.voterId);
    console.log('Remarks:', remarks);
    console.log('Timestamp:', new Date().toISOString());
    
    toast({
      title: "Manual Verification Request Submitted",
      description: "Your request has been sent to the Election Officer. Please wait for assistance.",
    });
    
    setRemarks('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Manual Verification Required</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium mb-2">
              Face verification failed after multiple attempts.
            </p>
            <p className="text-red-700 text-sm">
              Please contact the Election Officer for manual identity confirmation.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="voterName">Full Name</Label>
              <Input
                id="voterName"
                value={voterData.name}
                readOnly
                className="bg-gray-50 mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
                value={voterData.aadhaarNumber}
                readOnly
                className="bg-gray-50 mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="voterId">Voter ID</Label>
              <Input
                id="voterId"
                value={voterData.voterId}
                readOnly
                className="bg-gray-50 mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="remarks">Additional Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any additional information..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualVerificationModal;