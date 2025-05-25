
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SampleDataCreator = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSampleChallenges = async () => {
    setLoading(true);
    try {
      const sampleChallenges = [
        {
          title: "Healthcare AI Diagnostic Assistant",
          description: "Build an AI-powered diagnostic tool that can analyze medical images and provide preliminary assessments. This challenge focuses on computer vision techniques applied to medical imaging.",
          problem_statement: "Healthcare providers need faster, more accurate preliminary diagnostic tools to assist doctors in making treatment decisions. Your task is to create an AI system that can analyze X-rays, MRIs, or CT scans and provide diagnostic insights.",
          company_name: "MedTech Innovations",
          domains: ["Computer Vision", "Healthcare AI", "Deep Learning"],
          prize_amount: 1500000, // $15,000
          prize_description: "First place winner",
          submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          status: "active",
          deliverables: {
            repository: "Complete source code with training scripts",
            pitch_deck: "5-10 slide presentation",
            demo_video: "3-5 minute demonstration"
          },
          evaluation_rubric: {
            technical_implementation: 40,
            innovation: 25,
            presentation: 20,
            practicality: 15
          },
          data_pack_description: "Curated medical imaging dataset with anonymized patient data"
        },
        {
          title: "Financial Risk Assessment Bot",
          description: "Create an intelligent system that evaluates loan applications using multiple data sources and provides risk scores with explanations.",
          problem_statement: "Financial institutions need automated systems to assess loan default risk while maintaining transparency and fairness in their decision-making process.",
          company_name: "FinanceFlow",
          domains: ["NLP", "FinTech AI", "Machine Learning"],
          prize_amount: 1000000, // $10,000
          submission_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          status: "active",
          deliverables: {
            repository: "Complete ML pipeline with API",
            pitch_deck: "Business case presentation",
            demo_video: "Live system demonstration"
          },
          evaluation_rubric: {
            accuracy: 35,
            explainability: 30,
            bias_mitigation: 25,
            scalability: 10
          }
        },
        {
          title: "Smart City Traffic Optimization",
          description: "Build an AI system that optimizes traffic flow in urban environments using real-time data from sensors and cameras.",
          problem_statement: "Urban traffic congestion costs billions in lost productivity. Design an AI system that can analyze traffic patterns and optimize signal timing to reduce congestion.",
          company_name: "UrbanTech Solutions",
          domains: ["Computer Vision", "IoT AI", "Optimization"],
          prize_amount: 1200000, // $12,000
          submission_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
          status: "active",
          deliverables: {
            repository: "Simulation environment and algorithms",
            pitch_deck: "Implementation roadmap",
            demo_video: "Traffic simulation demonstration"
          },
          evaluation_rubric: {
            efficiency_improvement: 40,
            real_world_applicability: 30,
            technical_innovation: 20,
            environmental_impact: 10
          }
        }
      ];

      const { error } = await supabase
        .from('challenges')
        .insert(sampleChallenges);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sample challenges created successfully!",
      });
    } catch (error) {
      console.error('Error creating sample challenges:', error);
      toast({
        title: "Error",
        description: "Failed to create sample challenges.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/10 border-white/20 max-w-md">
      <CardHeader>
        <CardTitle className="text-white">Admin Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={createSampleChallenges}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600"
        >
          {loading ? 'Creating...' : 'Create Sample Challenges'}
        </Button>
        <p className="text-white/60 text-sm mt-2">
          This will add sample challenges for testing the platform.
        </p>
      </CardContent>
    </Card>
  );
};
