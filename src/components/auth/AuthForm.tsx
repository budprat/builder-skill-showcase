
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

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const handleSubmit = async (data: AuthFormData, event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    console.log("=== FORM SUBMIT TRIGGERED ===");
    console.log("Button clicked, form data:", { email: data.email, mode });
    
    if (isLoading) {
      console.log("Already loading, ignoring submit");
      return;
    }

    setIsLoading(true);
    
    try {
      // Clean up any existing auth state first
      console.log("Cleaning up auth state...");
      cleanupAuthState();
      
      // Try to sign out any existing session
      try {
        console.log("Attempting cleanup signout...");
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

        console.log("Signup response:", { data: signUpData, error });

        if (error) {
          console.error("Signup error:", error);
          
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
          
          // Try to redirect if we have a session
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

        console.log("Signin response:", { data: signInData, error });

        if (error) {
          console.error("Signin error:", error);
          
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
          console.error("Signin incomplete:", { user: signInData?.user, session: signInData?.session });
          
          toast({
            title: "Sign in incomplete",
            description: "Authentication was not completed properly. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      toast({
        title: "Authentication error",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("=== FORM SUBMIT COMPLETE ===");
    }
  };

  // Test button click handler
  const handleTestClick = () => {
    console.log("=== TEST BUTTON CLICKED ===");
    console.log("Form is valid:", form.formState.isValid);
    console.log("Form errors:", form.formState.errors);
    console.log("Form values:", form.getValues());
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                onClick={handleTestClick}
              >
                {isLoading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleTestClick}
                className="w-full text-white border-white/20"
              >
                Test Button Click
              </Button>
            </div>
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
