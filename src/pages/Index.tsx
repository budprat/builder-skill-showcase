
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Github, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const challenges = [
    {
      id: 1,
      title: "Healthcare AI Diagnostic Assistant",
      company: "MedTech Innovations",
      description: "Build an AI-powered diagnostic tool that can analyze medical images and provide preliminary assessments.",
      domains: ["Computer Vision", "Healthcare AI"],
      prize: "$15,000",
      deadline: "Dec 15, 2024",
      participants: 127,
      status: "active"
    },
    {
      id: 2,
      title: "Financial Risk Assessment Bot",
      company: "FinanceFlow",
      description: "Create an intelligent system that evaluates loan applications using multiple data sources.",
      domains: ["NLP", "FinTech AI"],
      prize: "$10,000",
      deadline: "Jan 8, 2025",
      participants: 89,
      status: "active"
    },
    {
      id: 3,
      title: "Personalized Learning Assistant",
      company: "EduNext",
      description: "Develop an AI tutor that adapts to individual learning styles and provides personalized recommendations.",
      domains: ["NLP", "EdTech AI"],
      prize: "$8,000",
      deadline: "Dec 30, 2024",
      participants: 156,
      status: "active"
    }
  ];

  const topBuilders = [
    { rank: 1, name: "Alex Chen", score: 2847, badges: 12 },
    { rank: 2, name: "Sarah Kumar", score: 2693, badges: 9 },
    { rank: 3, name: "Marcus Rodriguez", score: 2541, badges: 8 },
    { rank: 4, name: "Emma Thompson", score: 2387, badges: 7 },
    { rank: 5, name: "David Park", score: 2234, badges: 6 }
  ];

  const filterOptions = [
    { value: "all", label: "All Challenges" },
    { value: "nlp", label: "NLP" },
    { value: "cv", label: "Computer Vision" },
    { value: "healthcare", label: "Healthcare AI" },
    { value: "fintech", label: "FinTech AI" }
  ];

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
            <a href="#challenges" className="text-white/80 hover:text-white transition-colors">Challenges</a>
            <a href="#leaderboard" className="text-white/80 hover:text-white transition-colors">Leaderboard</a>
            <a href="#for-companies" className="text-white/80 hover:text-white transition-colors">For Companies</a>
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Where AI Talent
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Meets Opportunity
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Showcase your end-to-end AI product building skills through real-world challenges. 
            Get discovered by top companies and earn recognition for your practical AI expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4">
              Start Building <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4">
              Post a Challenge
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">2,847</div>
              <div className="text-white/60">Active Builders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">156</div>
              <div className="text-white/60">Live Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">$890K</div>
              <div className="text-white/60">Total Prizes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Challenges Section */}
      <section id="challenges" className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-4">Featured Challenges</h2>
              <p className="text-white/80">Build real AI products for top companies</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Search className="h-5 w-5 text-white/60" />
              <select 
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Active
                    </Badge>
                    <span className="text-2xl font-bold text-white">{challenge.prize}</span>
                  </div>
                  <CardTitle className="text-white text-xl">{challenge.title}</CardTitle>
                  <CardDescription className="text-white/70">
                    by {challenge.company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 mb-4">{challenge.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {challenge.domains.map((domain) => (
                      <Badge key={domain} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Deadline: {challenge.deadline}</span>
                    <span>{challenge.participants} participants</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View All Challenges
            </Button>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Top Builders</h2>
            <p className="text-white/80">Celebrating our most accomplished AI product builders</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Season Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topBuilders.map((builder) => (
                    <div key={builder.rank} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          builder.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                          builder.rank === 2 ? 'bg-gray-300 text-gray-800' :
                          builder.rank === 3 ? 'bg-amber-600 text-amber-100' :
                          'bg-white/20 text-white'
                        }`}>
                          {builder.rank}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{builder.name}</div>
                          <div className="text-white/60 text-sm">{builder.badges} badges earned</div>
                        </div>
                      </div>
                      <div className="text-white font-bold">{builder.score.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section id="for-companies" className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">For Companies</h2>
            <p className="text-white/80">Find proven AI talent who can ship products, not just solve algorithms</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/10 border-white/20 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Discover Top Talent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">Access a curated pool of AI builders who have proven their ability to create end-to-end solutions.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Github className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Real-World Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">Evaluate candidates based on their ability to build complete AI products, not just solve coding puzzles.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Reduce Hiring Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">Skip lengthy screening processes and connect directly with pre-vetted, capable AI professionals.</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-lg px-8 py-4">
              Post Your First Challenge
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                  E
                </div>
                <span className="text-xl font-bold text-white">EliteBuilders</span>
              </div>
              <p className="text-white/60">The premier platform for AI talent discovery and practical skill assessment.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Builders</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Browse Challenges</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Badges</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portfolio</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Companies</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Post Challenge</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Talent Search</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 mt-8 text-center text-white/60">
            <p>&copy; 2024 EliteBuilders. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
