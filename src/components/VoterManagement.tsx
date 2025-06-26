
import React, { useState } from 'react';
import { Edit, Trash2, Save, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useVoting } from '../context/VotingContext';

const VoterManagement = () => {
  const { voters, updateVoter, deleteVoter } = useVoting();
  const { toast } = useToast();
  const [editingVoter, setEditingVoter] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    aadhaarNumber: '',
    voterId: '',
    address: '',
  });

  const handleEdit = (voter: any) => {
    setEditingVoter(voter.id);
    setEditData({
      name: voter.name,
      aadhaarNumber: voter.aadhaarNumber,
      voterId: voter.voterId,
      address: voter.address,
    });
  };

  const handleSave = async (voterId: string) => {
    if (!editData.name || !editData.aadhaarNumber || !editData.voterId || !editData.address) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const result = updateVoter(voterId, editData);
    
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      setEditingVoter(null);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (voterId: string, voterName: string) => {
    if (window.confirm(`Are you sure you want to delete voter "${voterName}"? This action cannot be undone.`)) {
      const result = deleteVoter(voterId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    setEditingVoter(null);
    setEditData({ name: '', aadhaarNumber: '', voterId: '', address: '' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Voter Management ({voters.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {voters.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No voters registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Aadhaar Number</TableHead>
                  <TableHead>Voter ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      {editingVoter === voter.id ? (
                        <div>
                          <Label htmlFor={`name-${voter.id}`} className="sr-only">Name</Label>
                          <Input
                            id={`name-${voter.id}`}
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <span className="font-medium">{voter.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingVoter === voter.id ? (
                        <div>
                          <Label htmlFor={`aadhaar-${voter.id}`} className="sr-only">Aadhaar Number</Label>
                          <Input
                            id={`aadhaar-${voter.id}`}
                            value={editData.aadhaarNumber}
                            onChange={(e) => setEditData({ ...editData, aadhaarNumber: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      ) : (
                        voter.aadhaarNumber
                      )}
                    </TableCell>
                    <TableCell>
                      {editingVoter === voter.id ? (
                        <div>
                          <Label htmlFor={`voterId-${voter.id}`} className="sr-only">Voter ID</Label>
                          <Input
                            id={`voterId-${voter.id}`}
                            value={editData.voterId}
                            onChange={(e) => setEditData({ ...editData, voterId: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      ) : (
                        voter.voterId
                      )}
                    </TableCell>
                    <TableCell>
                      {editingVoter === voter.id ? (
                        <div>
                          <Label htmlFor={`address-${voter.id}`} className="sr-only">Address</Label>
                          <Input
                            id={`address-${voter.id}`}
                            value={editData.address}
                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <span className="max-w-xs truncate block">{voter.address}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        voter.hasVoted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {voter.hasVoted ? 'Voted' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {editingVoter === voter.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSave(voter.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(voter)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(voter.id, voter.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoterManagement;
