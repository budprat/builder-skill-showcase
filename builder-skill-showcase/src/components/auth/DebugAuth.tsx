import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const DebugAuth = () => {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const createTestAccount = async () => {
    console.log("=== CREATING TEST ACCOUNT ===");
    setIsLoading(true);
    try {
      const testEmail = "test@example.com";
      const testPassword = "testpassword123";

      console.log("Creating test account with:", testEmail);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      console.log("Sign up result:", { signUpData, signUpError });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setTestResult(`Test account already exists. You can now test sign in.`);
        } else {
          setTestResult(`Account creation failed: ${signUpError.message}`);
        }
      } else if (signUpData?.user) {
        setTestResult(`Test account created successfully! User ID: ${signUpData.user.id}. You can now test sign in.`);
      } else {
        setTestResult("Account creation returned no error but no user");
      }

    } catch (error: any) {
      console.error("Account creation error:", error);
      setTestResult(`Account creation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    console.log("=== DEBUGGING SUPABASE CONNECTION ===");
    setIsLoading(true);
    try {
      // Test basic connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session test:", { sessionData, sessionError });

      // Test sign in with the test account
      const testEmail = "test@example.com";
      const testPassword = "testpassword123";

      console.log("Testing sign in with:", testEmail);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      console.log("Sign in test result:", { signInData, signInError });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setTestResult(`Test account doesn't exist yet. Please create it first using the "Create Test Account" button.`);
        } else {
          setTestResult(`Sign in failed: ${signInError.message}`);
        }
      } else if (signInData?.user) {
        setTestResult(`Sign in successful! User ID: ${signInData.user.id}. Connection is working properly.`);
      } else {
        setTestResult("Sign in returned no error but no user");
      }

    } catch (error: any) {
      console.error("Test error:", error);
      setTestResult(`Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentSession = async () => {
    console.log("=== CHECKING CURRENT SESSION ===");
    setIsLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("Current session:", { session, error });

      if (error) {
        setTestResult(`Session check failed: ${error.message}`);
      } else if (session?.user) {
        setTestResult(`Currently signed in as: ${session.user.email} (ID: ${session.user.id})`);
      } else {
        setTestResult("No active session found");
      }
    } catch (error: any) {
      console.error("Session check error:", error);
      setTestResult(`Session check failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEvaluatorSignup = async () => {
    console.log("=== TESTING EVALUATOR SIGNUP ===");
    setIsLoading(true);
    try {
      const testEmail = `evaluator_test_${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      console.log("Testing evaluator signup with:", testEmail);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: "Test Evaluator",
            role: "evaluator",
          }
        }
      });

      console.log("Evaluator signup result:", { signUpData, signUpError });

      if (signUpError) {
        setTestResult(`Evaluator signup failed: ${signUpError.message}`);
      } else {
        setTestResult(`Evaluator signup successful! User ID: ${signUpData?.user?.id}`);
      }

    } catch (error: any) {
      console.error("Evaluator signup error:", error);
      setTestResult(`Evaluator signup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSponsorSignup = async () => {
    console.log("=== TESTING SPONSOR SIGNUP ===");
    setIsLoading(true);
    try {
      const testEmail = `sponsor_test_${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      console.log("Testing sponsor signup with:", testEmail);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: "Test Sponsor",
            role: "sponsor",
          }
        }
      });

      console.log("Sponsor signup result:", { signUpData, signUpError });

      if (signUpError) {
        setTestResult(`Sponsor signup failed: ${signUpError.message}`);
      } else {
        setTestResult(`Sponsor signup successful! User ID: ${signUpData?.user?.id}`);
      }

    } catch (error: any) {
      console.error("Sponsor signup error:", error);
      setTestResult(`Sponsor signup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignUp = async () => {

  }

  return (
    <div className="mt-4 p-4 border border-white/20 rounded-lg">
      <h3 className="text-white mb-2">Debug Tools</h3>
      <div className="space-y-2">
        <Button 
          onClick={createTestAccount}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Create Test Account
        </Button>
        <Button 
          onClick={testSupabaseConnection}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Test Sign In
        </Button>
        <Button 
          onClick={checkCurrentSession}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Check Current Session
        </Button>
        <Button 
          onClick={testSignUp}
          disabled={isLoading}
          className="w-full"
        >
          Test Sign Up
        </Button>

        <Button 
          onClick={testEvaluatorSignup}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Test Evaluator Signup
        </Button>

        <Button 
          onClick={testSponsorSignup}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Test Sponsor Signup
        </Button>
      </div>
      {testResult && (
        <div className="text-white text-sm mt-2 p-2 bg-black/20 rounded">
          {testResult}
        </div>
      )}
    </div>
  );
};