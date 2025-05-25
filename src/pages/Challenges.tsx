
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User } from "lucide-react";

const Challenges = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const challenges = [
    {
      id: 1,
      title: "Healthcare AI Diagnostic Assistant",
      company: "MedTech Innovations",
      description: "Build an AI-powered diagnostic tool that can analyze medical images and provide preliminary assessments. This challenge focuses on computer vision techniques applied to medical imaging.",
      domains: ["Computer Vision", "Healthcare AI"],
      prize: "$15,000",
      deadline: "Dec 15, 2024",
      participants: 127,
      status: "active",
      difficulty: "Advanced",
      estimatedTime: "2-3 weeks"
    },
    {
      id: 2,
      title: "Financial Risk Assessment Bot",
      company: "FinanceFlow",
      description: "Create an intelligent system that evaluates loan applications using multiple data sources and provides risk scores with explanations.",
      domains: ["NLP", "FinTech AI"],
      prize: "$10,000",
      deadline: "Jan 8, 2025",
      participants: 89,
      status: "active",
      difficulty: "Intermediate",
      estimatedTime: "1-2 weeks"
    },
    {
      id: 3,
      title: "Personalized Learning Assistant",
      company: "EduNext",
      description: "Develop an AI tutor that adapts to individual learning styles and provides personalized recommendations based on performance analytics.",
      domains: ["NLP", "EdTech AI"],
      prize: "$8,000",
      deadline: "Dec 30, 2024",
      participants: 156,
      status: "active",
      difficulty: "Intermediate",
      estimatedTime: "2 weeks"
    },
    {
      id: 4,
      title: "Smart City Traffic Optimization",
      company: "UrbanTech Solutions",
      description: "Build an AI system that optimizes traffic flow in urban environments using real-time data from sensors and cameras.",
      domains: ["Computer Vision", "IoT AI"],
      prize: "$12,000",
      deadline: "Jan 15, 2025",
      participants: 73,
      status: "upcoming",
      difficulty: "Advanced",
      estimatedTime: "3-4 weeks"
    },
    {
      id: 5,
      title: "E-commerce Recommendation Engine",
      company: "ShopSmart",
      description: "Create a sophisticated recommendation system that uses customer behavior, product attributes, and market trends.",
      domains: ["Machine Learning", "E-commerce AI"],
      prize: "$6,000",
      deadline: "Nov 30, 2024",
      participants: 234,
      status: "closed",
      difficulty: "Beginner",
      estimatedTime: "1 week"
    }
  ];

  const domains = [
    { value: "all", label: "All Domains" },
    { value: "nlp", label: "Natural Language Processing" },
    { value: "cv", label: "Computer Vision" },
    { value: "ml", label: "Machine Learning" },
    { value: "healthcare", label: "Healthcare AI" },
    { value: "fintech", label: "FinTech AI" },
    { value: "edtech", label: "EdTech AI" },
    { value: "iot", label: "IoT AI" },
    { value: "ecommerce", label: "E-commerce AI" }
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "upcoming", label: "Upcoming" },
    { value: "closed", label: "Closed" }
  ];

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === "all" || challenge.domains.some(domain => 
      domain.toLowerCase().includes(selectedDomain.toLowerCase())
    );
    const matchesStatus = selectedStatus === "all" || challenge.status === selectedStatus;
    
    return matchesSearch && matchesDomain && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Advanced":
        return "bg-red-500/20 text-red-300 border-red-500/30";
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
            <a href="/challenges" className="text-white border-b-2 border-blue-400">Challenges</a>
            <a href="/leaderboard" className="text-white/80 hover:text-white transition-colors">Leaderboard</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Join as Builder
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI Building Challenges</h1>
          <p className="text-white/80 text-lg">Showcase your AI product development skills and compete for prizes</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search challenges, companies, or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              {domains.map(domain => (
                <option key={domain.value} value={domain.value} className="bg-slate-900">
                  {domain.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value} className="bg-slate-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-white/80">
            Showing {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Challenge Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredChallenges.map((challenge) => (
            <Card key={challenge.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </Badge>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  <span className="text-2xl font-bold text-white">{challenge.prize}</span>
                </div>
                <CardTitle className="text-white text-xl mb-2">{challenge.title}</CardTitle>
                <CardDescription className="text-white/70">
                  by {challenge.company}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">{challenge.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {challenge.domains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {domain}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-white/60">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due: {challenge.deadline}
                  </div>
                  <div className="flex items-center text-white/60">
                    <User className="h-4 w-4 mr-2" />
                    {challenge.participants} participants
                  </div>
                </div>

                <div className="text-sm text-white/60">
                  Estimated time: {challenge.estimatedTime}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={challenge.status === "closed"}
                  >
                    {challenge.status === "active" ? "Join Challenge" : 
                     challenge.status === "upcoming" ? "Notify Me" : "View Results"}
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">No challenges found matching your criteria.</div>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedDomain("all");
                setSelectedStatus("all");
              }}
              variant="outline" 
              className="mt-4 border-white/20 text-white hover:bg-white/10"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
