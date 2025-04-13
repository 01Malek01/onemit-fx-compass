
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome to Oneremit FX Terminal",
          variant: "default"
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background dashboard-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Oneremit FX Terminal</h1>
          <p className="text-muted-foreground">Enter your credentials to access the dashboard</p>
        </div>
        
        <Card className="fx-card border border-border/40">
          <CardHeader>
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>
              Sign in to manage FX rates and calculator
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="admin@admin.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Password"
                    required
                  />
                  <div 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 
                      <EyeOff className="h-5 w-5 text-muted-foreground" /> : 
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    }
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Secured access for authorized personnel only
            </p>
            <p className="text-xs text-muted-foreground">
              First time? Visit the <a href="/setup" className="text-primary hover:underline">Setup Page</a> to create your admin account
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Oneremit FX Terminal - Powered by <a href="#" className="text-primary hover:underline">Oneremit</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
