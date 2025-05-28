import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cleanupAuthState } from "@/utils/authCleanup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createAuthSchema = (mode: "signin" | "signup") => {
  const baseSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  if (mode === "signup") {
    return baseSchema.extend({
      fullName: z.string().min(2, "Full name must be at least 2 characters"),
      role: z.enum(["participant", "sponsor", "evaluator"]),
    });
  }

  return baseSchema.extend({
    fullName: z.string().optional(),
  });
};

type AuthFormData = z.infer<ReturnType<typeof createAuthSchema>>;

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
    resolver: zodResolver(createAuthSchema(mode)),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "participant",
    },
  });

  // Reset form when mode changes
  useState(() => {
    form.reset({
      email: "",
      password: "",
      fullName: "",
      role: "participant",
    });
  });

  const handleSubmit = async (data: AuthFormData) => {
    console.log("=== FORM SUBMIT TRIGGERED ===");
    console.log("Form data:", { email: data.email, mode, fullName: data.fullName, role: data.role });

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
        console.log("=== STARTING SIGNUP PROCESS ===");

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: data.role,
            }
          }
        });

        console.log("Signup response:", { authData, signUpError });

        if (signUpError) {
          console.error("Signup error:", signUpError);

          // If user already exists, provide a more helpful message
          if (signUpError.message.includes("User already registered")) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Please sign in instead or use a different email.",
              variant: "destructive",
            });
            return;
          }

          throw signUpError;
        }

        if (authData.user && !authData.session) {
          console.log("User created but needs email confirmation");
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account before signing in.",
          });
          return;
        }

        if (authData.user && authData.session) {
          console.log("User created and signed in automatically");
          console.log("User ID:", authData.user.id);

          // Create profile first
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                full_name: data.fullName,
                username: data.email.split('@')[0], // Generate username from email
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (profileError && !profileError.message.includes('duplicate')) {
              console.error("Error creating profile:", profileError);
            } else {
              console.log("Profile created successfully");
            }
          } catch (profileError) {
            console.error("Profile creation error:", profileError);
          }

          // Ensure role is assigned (with retry logic)
          let roleAssigned = false;
          let retries = 3;

          while (!roleAssigned && retries > 0) {
            try {
              // First check if role already exists
              const { data: existingRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', authData.user.id)
                .eq('role', data.role)
                .maybeSingle();

              if (existingRole) {
                console.log("Role already exists:", data.role);
                roleAssigned = true;
                break;
              }

              // Insert the role
              const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: authData.user.id,
                  role: data.role
                });

              if (!roleError) {
                console.log("Role assigned successfully:", data.role);
                roleAssigned = true;
              } else if (roleError.message.includes('duplicate') || roleError.code === '23505') {
                console.log("Role already exists (duplicate key)");
                roleAssigned = true;
              } else {
                console.error(`Role assignment attempt ${4 - retries} failed:`, roleError);
                retries--;
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
              }
            } catch (roleAssignError) {
              console.error(`Role assignment error (attempt ${4 - retries}):`, roleAssignError);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (!roleAssigned) {
            console.error("Failed to assign role after all retries");
            toast({
              title: "Account created with warning",
              description: "Your account was created but there was an issue assigning your role. Please contact support.",
              variant: "destructive",
            });
          }

          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });

          // Navigate to dashboard
          navigate("/dashboard");
        }
      } else {
        console.log("=== STARTING SIGNIN PROCESS ===");

        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        console.log("Signin response:", { authData, signInError });

        if (signInError) {
          console.error("Signin error:", signInError);
          throw signInError;
        }

        if (authData.user && authData.session) {
          toast({
            title: "Success",
            description: `Welcome back!`,
          });

          console.log('User signed in successfully');
          console.log('User ID:', authData.user?.id);
          console.log('=== AUTH PROCESS COMPLETED ===');

          // Add a small delay to ensure auth state is updated before navigation
          setTimeout(() => {
            console.log('=== NAVIGATING TO DASHBOARD ===');
            navigate('/dashboard');
          }, 500);
        }
      }
    } catch (error: any) {
      console.error("=== AUTH ERROR ===");
      console.error("Error details:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and click the confirmation link before signing in.";
        } else if (error.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: mode === "signin" ? "Sign in failed" : "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("=== AUTH PROCESS COMPLETED ===");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white border-gray-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-900">
          {mode === "signin" ? "Welcome Back" : "Join EliteBuilders"}
        </CardTitle>
        <CardDescription className="text-gray-600">
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
              <>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          className="border-gray-300 text-gray-900 placeholder:text-gray-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900">Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 text-gray-900 placeholder:text-gray-500">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="participant">Participant</SelectItem>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      className="border-gray-300 text-gray-900 placeholder:text-gray-500"
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
                  <FormLabel className="text-gray-900">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-gray-300 text-gray-900 placeholder:text-gray-500 pr-10"
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
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Button
            variant="link"
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 p-0"
            disabled={isLoading}
          >
            {mode === "signin" ? "Sign up here" : "Sign in here"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};