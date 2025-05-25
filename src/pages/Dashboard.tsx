
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Github, User, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const userStats = {
    name: "Alex Chen",
    title: "AI Product Builder",
    careerScore: 2847,
    globalRank: 12,
    challengesCompleted: 8,
    challengesWon: 3,
    totalEarnings: "$23,500",
    badges: 12
  };

  const activeSubmissions = [
    {
      id: 1,
      challengeTitle: "Healthcare AI Diagnostic Assistant",
      company: "MedTech Innovations",
      status: "In Review",
      submittedDate: "Nov 20, 2024",
      provisionalScore: 87,
      daysLeft: 5
    },
    {
      id: 2,
      challengeTitle: "Financial Risk Assessment Bot",
      company: "FinanceFlow",
      status: "Submitted",
      submittedDate: "Nov 18, 2024",
      provisionalScore: null,
      daysLeft: 7
    }
  ];

  const recentAchievements = [
    {
      id: 1,
      type: "badge",
      title: "Top 10% Finisher",
      description: "Healthcare AI Challenge",
      date: "Nov 15, 2024",
      icon: "🏆"
    },
    {
      id: 2,
      type: "ranking",
      title: "Global Rank #12",
      description: "Moved up 3 positions",
      date: "Nov 10, 2024",
      icon: "📈"
    },
    {
      id: 3,
      type: "badge",
      title: "Sponsor Favorite",
      description: "E-commerce AI Challenge",
      date: "Nov 5, 2024",
      icon: "⭐"
    }
  ];

  const recommendedChallenges = [
    {
      id: 1,
      title: "Smart City Traffic Optimization",
      company: "UrbanTech Solutions",
      match: 92,
      prize: "$12,000",
      deadline: "Jan 15, 2025",
      domains: ["Computer Vision", "IoT AI"]
    },
    {
      id: 2,
      title: "Customer Service Chatbot",
      company: "ServicePro",
      match: 87,
      prize: "$7,500",
      deadline: "Dec 20, 2024",
      domains: ["NLP", "Customer AI"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Review":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Submitted":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Scored":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="text-2xl font-bold text-white">EliteBuilders</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-white/80 hover:text-white transition-colors">Home</a>
            <a href="/challenges" className="text-white/80 hover:text-white transition-colors">Challenges</a>
            <a href="/dashboard" className="text-white border-b-2 border-blue-400">Dashboard</a>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-medium">{userStats.name}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                AC
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{userStats.name}</h1>
                <p className="text-white/70">{userStats.title}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-white/60">Global Rank #{userStats.globalRank}</span>
                  <span className="text-white/60">•</span>
                  <span className="text-white/60">{userStats.badges} badges</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{userStats.careerScore}</div>
              <div className="text-white/60">Career Score</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{userStats.challengesCompleted}</div>
                <div className="text-white/60 text-sm">Challenges Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{userStats.challengesWon}</div>
                <div className="text-white/60 text-sm">Challenges Won</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{userStats.totalEarnings}</div>
                <div className="text-white/60 text-sm">Total Earnings</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">{userStats.badges}</div>
                <div className="text-white/60 text-sm">Badges Earned</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "submissions", label: "My Submissions" },
              { id: "achievements", label: "Achievements" },
              { id: "profile", label: "Profile" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Submissions */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Active Submissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeSubmissions.map((submission) => (
                    <div key={submission.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold">{submission.challengeTitle}</h4>
                          <p className="text-white/60 text-sm">by {submission.company}</p>
                        </div>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Submitted: {submission.submittedDate}</span>
                        {submission.provisionalScore && (
                          <span className="text-white">Provisional Score: {submission.provisionalScore}</span>
                        )}
                      </div>
                      {submission.daysLeft > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-white/60 mb-1">
                            <span>Judging period</span>
                            <span>{submission.daysLeft} days left</span>
                          </div>
                          <Progress value={(10 - submission.daysLeft) * 10} className="h-1" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recommended Challenges */}
              <Card className="bg-white/10 border-white/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Recommended for You</CardTitle>
                  <CardDescription className="text-white/70">
                    Challenges matching your skills and interests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendedChallenges.map((challenge) => (
                    <div key={challenge.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold">{challenge.title}</h4>
                          <p className="text-white/60 text-sm">by {challenge.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{challenge.prize}</div>
                          <div className="text-green-400 text-sm">{challenge.match}% match</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {challenge.domains.map((domain) => (
                          <Badge key={domain} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {domain}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Deadline: {challenge.deadline}</span>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600">
                          View Challenge <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            <div>
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <div className="text-white font-medium">{achievement.title}</div>
                        <div className="text-white/60 text-sm">{achievement.description}</div>
                        <div className="text-white/50 text-xs">{achievement.date}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">My Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-white/60">
                Detailed submission history will be displayed here.
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "achievements" && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Achievements & Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-white/60">
                Badge gallery and achievement details will be displayed here.
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "profile" && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-white/60">
                Profile editing form will be displayed here.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
