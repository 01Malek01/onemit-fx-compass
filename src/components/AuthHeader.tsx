
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="bg-primary/20 p-1 rounded-full">
          <User size={16} className="text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {user.email?.split('@')[0]}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleLogout} 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
};

export default AuthHeader;
