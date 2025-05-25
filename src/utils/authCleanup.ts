
export const cleanupAuthState = () => {
  console.log("=== CLEANING UP AUTH STATE ===");
  
  // Remove standard auth tokens
  try {
    localStorage.removeItem('supabase.auth.token');
    console.log("Removed supabase.auth.token");
  } catch (e) {
    console.log("No supabase.auth.token to remove");
  }
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log("Removing localStorage key:", key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  try {
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log("Removing sessionStorage key:", key);
        sessionStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.log("No sessionStorage available");
  }
  
  console.log("=== AUTH STATE CLEANUP COMPLETE ===");
};
