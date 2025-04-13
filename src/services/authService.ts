
import { supabase } from "@/integrations/supabase/client";

// This function should be run once to create the admin user
// It's recommended to remove this function after creating the admin user
export async function createAdminUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error creating admin user:", error.message);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: "Admin user created successfully. Please verify the email if required.",
      user: data.user 
    };
  } catch (error: any) {
    console.error("Unexpected error creating admin user:", error.message);
    return { success: false, message: error.message || "An unexpected error occurred" };
  }
}

// Check if a user is logged in
export async function checkAuthStatus() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}
