
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import ParallaxBackground from '@/components/ParallaxBackground';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Auth() {
  const { signIn, signUp, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent, mode: 'signin' | 'signup') => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        console.error('Authentication error:', error);
        toast.error(error.message || 'Authentication failed');
      } else if (mode === 'signup') {
        toast.success('Account created! Please check your email for verification.');
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ParallaxBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="w-full border-border/40 shadow-lg backdrop-blur-lg bg-card/80 fx-card">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Oneremit FX Terminal
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={(e) => handleSubmit(e, 'signin')}>
                  <CardContent className="space-y-5 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="name@example.com" 
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          className="pl-10 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button 
                          type="button"
                          onClick={togglePasswordVisibility} 
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || authLoading}
                    >
                      {isLoading ? 'Signing In...' : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit(e, 'signup')}>
                  <CardContent className="space-y-5 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="signup-email" 
                          type="email" 
                          placeholder="name@example.com" 
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="signup-password" 
                          type={showPassword ? "text" : "password"} 
                          className="pl-10 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button 
                          type="button"
                          onClick={togglePasswordVisibility} 
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || authLoading}
                    >
                      {isLoading ? 'Creating Account...' : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="px-8 pb-8 pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to Oneremit's Terms of Service and Privacy Policy.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
}
