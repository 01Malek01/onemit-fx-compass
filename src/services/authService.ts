
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

// This function should be run once to create the admin user
// It's recommended to remove this function after creating the admin user
export async function createAdminUser(email: string, password: string) {
  try {
    // Convert simple username to email format if it's not already an email
    const formattedEmail = email.includes('@') ? email : `${email}@admin.com`;
    
    // First check if the user already exists
    const { data } = await supabase.auth.admin.listUsers();
    
    // Check if the admin user already exists in the returned users array
    // Use optional chaining and properly type the users array
    const existingAdmin = data?.users?.find((user: User) => user.email === formattedEmail);
    
    if (existingAdmin) {
      return { 
        success: true, 
        message: "Admin user already exists. You can log in with the admin credentials.",
        user: existingAdmin
      };
    }
    
    // Create the user if they don't exist
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: formattedEmail,
      password,
    });

    if (error) {
      console.error("Error creating admin user:", error.message);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: "Admin user created successfully. Please verify the email if required.",
      user: signUpData.user 
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

// Direct sign-in function
export async function signInUser(email: string, password: string) {
  try {
    // Ensure email format
    const formattedEmail = email.includes('@') ? email : `${email}@admin.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password,
    });
    
    if (error) throw error;
    
    return {
      success: true,
      user: data.user,
      session: data.session
    };
  } catch (error: any) {
    console.error("Login error:", error.message);
    return {
      success: false,
      message: error.message || "Invalid login credentials"
    };
  }
}
