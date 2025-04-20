
import React, { useState } from 'react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { Button } from "@/components/ui/button";
import { CheckCheck, Trash2, BellOff } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export function NotificationList() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    removeNotification 
  } = useNotifications();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="text-sm font-medium">No notifications</h3>
        <p className="text-xs text-muted-foreground mt-1">
          You're all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-medium">Notifications</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs" 
            onClick={markAllAsRead} 
            title="Mark all as read"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Read all
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs" 
            onClick={clearAll} 
            title="Clear all notifications"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      <div className="overflow-y-auto">
        <AnimatePresence initial={false}>
          {notifications.slice(0, 10).map((notification) => (
            <NotificationItem 
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => markAsRead(notification.id)}
              onRemove={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onRemove: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { id, title, description, type, timestamp, read } = notification;

  const getBadgeVariant = () => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info':
      default: return 'default';
    }
  };

  const handleClick = () => {
    if (!read) {
      onMarkAsRead();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative border-b p-3 cursor-pointer transition-colors ${read ? 'bg-background' : 'bg-muted/30'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getBadgeVariant()} className="px-1.5 py-0 text-[10px] h-4">
              {type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>
          
          <h4 className="text-sm font-medium leading-tight">{title}</h4>
          
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
          )}
        </div>
        
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {!read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}
    </motion.div>
  );
}
