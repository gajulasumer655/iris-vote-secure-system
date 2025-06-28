import React, { useState } from 'react';
import { BarChart3, Trophy, Users, TrendingUp, Shield, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useVoting } from '../context/VotingContext';

const Results = () => {
  const { candidates, voters, isAdminAuthenticated, authenticateAdmin, logoutAdmin } = useVoting();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  const totalVoters = voters.length;
  const voterTurnout = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;
  
  const winner = candidates.reduce((prev, current) => 
    (prev.voteCount > current.voteCount) ? prev : current
  );

  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticateAdmin(loginData.username, loginData.password)) {
      toast({
        title: "Access Granted",
        description: "Welcome to the results dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    }
  };

  // Show login form if admin is not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Shield className="h-6 w-6" />
              <span>Admin Access Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Election results are restricted to authorized administrators only. 
                Please enter your admin credentials to view the results.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Enter username"
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
                  placeholder="Enter password"
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Access Results
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results if admin is authenticated
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Election Results</h2>
          <p className="text-lg text-gray-600">Live voting results and statistics</p>
        </div>
        <Button onClick={logoutAdmin} variant="outline" className="flex items-center space-x-2">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Trophy className="h-12 w-12 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{winner.voteCount}</p>
                <p className="text-gray-600">Leading Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-12 w-12 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalVotes}</p>
                <p className="text-gray-600">Total Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-12 w-12 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalVoters}</p>
                <p className="text-gray-600">Registered Voters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-12 w-12 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{voterTurnout.toFixed(1)}%</p>
                <p className="text-gray-600">Voter Turnout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalVotes > 0 && (
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Trophy className="h-6 w-6" />
              <span>Winner: {winner.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <span className="text-6xl">{winner.symbol}</span>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{winner.name}</h3>
                <p className="text-lg text-gray-600 mb-2">{winner.party}</p>
                <p className="text-xl font-semibold text-green-600">
                  {winner.voteCount} votes ({totalVotes > 0 ? ((winner.voteCount / totalVotes) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Detailed Results</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {sortedCandidates.map((candidate, index) => (
              <div key={candidate.id} className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 w-48">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <span className="text-3xl">{candidate.symbol}</span>
                  <div>
                    <h4 className="font-semibold">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.party}</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {candidate.voteCount} votes
                    </span>
                    <span className="text-sm text-gray-600">
                      {totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0}
                    className="h-3"
                  />
                </div>
              </div>
            ))}
          </div>

          {totalVotes === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No votes have been cast yet.</p>
              <p>Results will appear here once voting begins.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
