
import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { NotificationList } from './NotificationList';
import { AnimatePresence, motion } from 'framer-motion';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div 
                className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-semibold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 mr-2" 
        align="end"
        sideOffset={5}
      >
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
