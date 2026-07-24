import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  displayName?: string;
  avatarUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  displayName = 'User',
  avatarUrl,
  className = '',
  size = 'md',
}) => {
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts[0] && parts[0].length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'L';
  };

  const initials = getInitials(displayName);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg font-bold',
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className} border border-border/80 shadow-xs`}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
      <AvatarFallback className="bg-primary/10 text-primary font-bold tracking-wider">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
