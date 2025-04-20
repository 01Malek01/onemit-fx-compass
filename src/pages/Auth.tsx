
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import ParallaxBackground from '@/components/ParallaxBackground';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Auth() {
  const {
    signIn,
    isLoading: authLoading
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        console.error('Authentication error:', error);
        toast.error(error.message || 'Authentication failed');
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
      <div className="w-full max-w-md px-4 my-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }} 
          className="w-full"
        >
          <Card className="shadow-[0_0_50px_rgba(0,98,255,0.1)] border-white/[0.05] bg-card/30 backdrop-blur-2xl p-6">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#0062FF] to-blue-400 bg-clip-text text-transparent">
                  Oneremit Terminal
                </h1>
                <p className="text-muted-foreground/80 text-lg">
                  Enter your credentials to access the platform
                </p>
              </div>
              
              <div className="w-full">
                <div className="bg-[#0062FF] text-white py-4 rounded-lg text-center text-xl font-medium">
                  Sign In
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg font-medium text-foreground/90">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/70" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="pl-10 py-6 bg-secondary/50 border-white/[0.05] focus-visible:ring-[#0062FF] text-lg" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg font-medium text-foreground/90">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/70" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      className="pl-10 pr-10 py-6 bg-secondary/50 border-white/[0.05] focus-visible:ring-[#0062FF] text-lg" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility} 
                      className="absolute right-3 top-3.5 text-muted-foreground/70 hover:text-foreground/90 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg bg-[#0062FF] hover:bg-[#0062FF]/90 transition-all duration-300" 
                  disabled={isLoading || authLoading}
                >
                  {isLoading ? 'Signing In...' : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground/70">
                  By continuing, you agree to Oneremit's Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
};
