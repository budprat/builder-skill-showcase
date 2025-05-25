
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cleanupAuthState } from "@/utils/authCleanup";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: "signin" | "signup";
  onToggleMode: () => void;
}

export const AuthForm = ({ mode, onToggleMode }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    console.log("=== AUTH FORM SUBMIT START ===");
    console.log("Mode:", mode);
    console.log("Email:", data.email);
    
    try {
      // Clean up any existing auth state first
      cleanupAuthState();
      
      // Try to sign out any existing session
      try {
        console.log("=== ATTEMPTING CLEANUP SIGNOUT ===");
        await supabase.auth.signOut({ scope: 'global' });
      } catch (cleanupError) {
        console.log("Cleanup signout failed (this is normal):", cleanupError);
      }

      if (mode === "signup") {
        console.log("=== ATTEMPTING SIGNUP ===");
        
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
            },
          },
        });

        console.log("=== SIGNUP RESPONSE ===");
        console.log("SignUp Data:", signUpData);
        console.log("SignUp Error:", error);

        if (error) {
          console.error("Signup error details:", error);
          
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            onToggleMode();
            return;
          }
          
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (signUpData.user) {
          console.log("Signup successful, user created:", signUpData.user.id);
          toast({
            title: "Account created!",
            description: "Please check your email for verification (if required).",
          });
          
          // Try to sign in immediately after signup
          if (signUpData.session) {
            console.log("User has session after signup, redirecting...");
            window.location.href = "/dashboard";
          }
        }

      } else {
        console.log("=== ATTEMPTING SIGNIN ===");
        
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        console.log("=== SIGNIN RESPONSE ===");
        console.log("SignIn Data:", signInData);
        console.log("SignIn Error:", error);
        console.log("User exists:", !!signInData?.user);
        console.log("Session exists:", !!signInData?.session);

        if (error) {
          console.error("=== SIGNIN ERROR ===");
          console.error("Error message:", error.message);
          console.error("Error details:", error);
          
          let errorMessage = "Sign in failed. Please check your credentials.";
          
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Invalid email or password. Please check your credentials and try again.";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Please check your email and click the confirmation link before signing in.";
          } else if (error.message.includes("too many requests")) {
            errorMessage = "Too many login attempts. Please wait a moment and try again.";
          }
          
          toast({
            title: "Sign in failed",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        if (signInData?.user && signInData?.session) {
          console.log("=== SIGNIN SUCCESS ===");
          console.log("Redirecting to dashboard...");
          
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });

          // Force a full page reload to ensure clean state
          window.location.href = "/dashboard";
          
        } else {
          console.error("=== SIGNIN INCOMPLETE ===");
          console.error("User:", signInData?.user);
          console.error("Session:", signInData?.session);
          
          toast({
            title: "Sign in incomplete",
            description: "Authentication was not completed properly. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("=== AUTH ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      
      toast({
        title: "Authentication error",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("=== AUTH FORM SUBMIT END ===");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">
          {mode === "signin" ? "Welcome Back" : "Join EliteBuilders"}
        </CardTitle>
        <CardDescription className="text-white/80">
          {mode === "signin" 
            ? "Sign in to access your dashboard and participate in challenges" 
            : "Create your account to start building AI solutions"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === "signup" && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-white/60" />
                        ) : (
                          <Eye className="h-4 w-4 text-white/60" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-white/80">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Button
            variant="link"
            onClick={onToggleMode}
            className="text-blue-400 hover:text-blue-300 p-0"
            disabled={isLoading}
          >
            {mode === "signin" ? "Sign up here" : "Sign in here"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
