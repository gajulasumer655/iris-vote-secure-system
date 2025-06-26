
import React, { useState } from 'react';
import { Shield, Users, UserPlus, LogOut, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useVoting } from '../context/VotingContext';
import VoterManagement from './VoterManagement';

const AdminDashboard = () => {
  const { isAdminAuthenticated, authenticateAdmin, logoutAdmin, candidates, addCandidate, voters } = useVoting();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [candidateData, setCandidateData] = useState({ name: '', party: '', symbol: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticateAdmin(loginData.username, loginData.password)) {
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard.",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    }
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateData.name || !candidateData.party || !candidateData.symbol) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all candidate details.",
        variant: "destructive",
      });
      return;
    }

    addCandidate(candidateData);
    setCandidateData({ name: '', party: '', symbol: '' });
    toast({
      title: "Candidate Added",
      description: "New candidate has been added successfully.",
    });
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Shield className="h-6 w-6" />
              <span>Admin Login</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="vamshi or sumer"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="admin123"
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const votedVoters = voters.filter(voter => voter.hasVoted);
  const pendingVoters = voters.filter(voter => !voter.hasVoted);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
        <Button onClick={logoutAdmin} variant="outline" className="flex items-center space-x-2">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-12 w-12 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{voters.length}</p>
                <p className="text-gray-600">Registered Voters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <UserPlus className="h-12 w-12 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{candidates.length}</p>
                <p className="text-gray-600">Total Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Shield className="h-12 w-12 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{voters.filter(v => v.hasVoted).length}</p>
                <p className="text-gray-600">Votes Cast</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voter Management Section */}
      <VoterManagement />

      {/* Voters Who Cast Their Vote Section */}
      <Card className="shadow-lg border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Voters Who Have Cast Their Vote ({votedVoters.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {votedVoters.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No votes have been cast yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Aadhaar Number</TableHead>
                    <TableHead>Voter ID</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Vote Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votedVoters.map((voter) => (
                    <TableRow key={voter.id} className="bg-green-50/50">
                      <TableCell className="font-medium">{voter.name}</TableCell>
                      <TableCell>{voter.aadhaarNumber}</TableCell>
                      <TableCell>{voter.voterId}</TableCell>
                      <TableCell className="max-w-xs truncate">{voter.address}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-semibold">Vote Cast</span>
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Add New Candidate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="candidateName">Candidate Name</Label>
                <Input
                  id="candidateName"
                  value={candidateData.name}
                  onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value })}
                  placeholder="Enter candidate name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="party">Party</Label>
                <Input
                  id="party"
                  value={candidateData.party}
                  onChange={(e) => setCandidateData({ ...candidateData, party: e.target.value })}
                  placeholder="Enter party name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol (Emoji)</Label>
                <Input
                  id="symbol"
                  value={candidateData.symbol}
                  onChange={(e) => setCandidateData({ ...candidateData, symbol: e.target.value })}
                  placeholder="🔵 🔴 ⭐"
                  className="mt-2"
                />
              </div>
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Add Candidate
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{candidate.symbol}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                    <p className="text-gray-600">{candidate.party}</p>
                    <p className="text-sm text-blue-600">Votes: {candidate.voteCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
