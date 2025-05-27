
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Star, Zap, Target, Users } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<"badges">;
type UserBadgeType = Tables<"user_badges"> & {
  badges: BadgeType;
};

interface BadgeDisplayProps {
  badge: BadgeType;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

const getBadgeIcon = (badgeType: string) => {
  switch (badgeType) {
    case 'challenge_winner':
      return Trophy;
    case 'first_submission':
      return Star;
    case 'speed_demon':
      return Zap;
    case 'perfectionist':
      return Target;
    case 'team_player':
      return Users;
    default:
      return Award;
  }
};

const getBadgeColor = (badgeType: string) => {
  switch (badgeType) {
    case 'challenge_winner':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'first_submission':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'speed_demon':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'perfectionist':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'team_player':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  badge, 
  earnedAt, 
  size = 'md', 
  showDescription = false 
}) => {
  const Icon = getBadgeIcon(badge.badge_type);
  const colorClass = getBadgeColor(badge.badge_type);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`inline-flex items-center gap-2 rounded-full border font-semibold transition-colors ${colorClass} ${sizeClasses[size]}`}>
        <Icon className={iconSizes[size]} />
        <span>{badge.name}</span>
      </div>
      
      {showDescription && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{badge.description}</p>
          {earnedAt && (
            <p className="text-xs text-gray-500">
              Earned on {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
