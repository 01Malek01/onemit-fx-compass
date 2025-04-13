
import React, { useState, useEffect } from 'react';
import { createAdminUser, checkAuthStatus } from '@/services/authService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/hooks/use-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Setup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEmailVerificationInfo, setShowEmailVerificationInfo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await checkAuthStatus();
      if (user) {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, []);

  const createAdmin = async () => {
    setIsCreating(true);
    
    try {
      // Fixed admin credentials as per requirement
      const email = "admin";  // Will be formatted to admin@admin.com in the service
      const password = "spark1@";
      
      const result = await createAdminUser(email, password);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Admin account created! ${result.message}`,
        });
        
        // Show email verification info dialog
        setShowEmailVerificationInfo(true);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const closeDialog = () => {
    setShowEmailVerificationInfo(false);
    navigate('/login');
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background dashboard-bg">
      <div className="w-full max-w-md">
        <Card className="fx-card border border-border/40">
          <CardHeader>
            <CardTitle className="text-xl">Setup Admin User</CardTitle>
            <CardDescription>
              Create the admin user account for the FX Terminal
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-md">
                <p className="text-sm">
                  This will create an admin user with the following credentials:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Username: <span className="font-mono">admin</span></li>
                  <li>Password: <span className="font-mono">spark1@</span></li>
                </ul>
              </div>
              
              <Button 
                onClick={createAdmin} 
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? "Creating Admin..." : "Create Admin User"}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: This page should only be accessed during initial setup.
            </p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showEmailVerificationInfo} onOpenChange={setShowEmailVerificationInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Verification Required</DialogTitle>
            <DialogDescription>
              The admin account has been created but you may need to verify the email address before logging in.
              Check the inbox for admin@admin.com or check your Supabase dashboard to confirm the user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center flex-col sm:flex-row">
            <Button onClick={closeDialog}>
              Continue to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Setup;
