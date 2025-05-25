
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const DebugAuth = () => {
  const [testResult, setTestResult] = useState<string>("");

  const testSupabaseConnection = async () => {
    console.log("=== DEBUGGING SUPABASE CONNECTION ===");
    try {
      // Test basic connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session test:", { sessionData, sessionError });
      
      // Test sign in with a test account
      const testEmail = "test@example.com";
      const testPassword = "testpassword123";
      
      console.log("Testing sign in with:", testEmail);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      console.log("Sign in test result:", { signInData, signInError });
      
      if (signInError) {
        setTestResult(`Sign in failed: ${signInError.message}`);
      } else if (signInData?.user) {
        setTestResult(`Sign in successful! User ID: ${signInData.user.id}`);
      } else {
        setTestResult("Sign in returned no error but no user");
      }
      
    } catch (error: any) {
      console.error("Test error:", error);
      setTestResult(`Test failed: ${error.message}`);
    }
  };

  return (
    <div className="mt-4 p-4 border border-white/20 rounded-lg">
      <h3 className="text-white mb-2">Debug Tools</h3>
      <Button 
        onClick={testSupabaseConnection}
        variant="outline"
        className="mb-2 mr-2"
      >
        Test Supabase Connection
      </Button>
      {testResult && (
        <div className="text-white text-sm mt-2 p-2 bg-black/20 rounded">
          {testResult}
        </div>
      )}
    </div>
  );
};
