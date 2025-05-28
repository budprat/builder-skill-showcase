import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BadgeDisplay } from './BadgeDisplay';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<"badges">;
type UserBadgeType = Tables<"user_badges"> & {
  badges: BadgeType;
};

interface BadgeCollectionProps {
  userId: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ 
  userId, 
  showTitle = true, 
  compact = false 
}) => {
  const [userBadges, setUserBadges] = useState<UserBadgeType[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      console.log('Fetching badges for user:', userId);

      // Fetch user's earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId);

      if (earnedError) {
        console.error('Error fetching user badges:', earnedError);
        throw earnedError;
      }

      console.log('User badges fetched:', earnedBadges);

      // Fetch all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('name');

      if (badgesError) {
        console.error('Error fetching all badges:', badgesError);
        throw badgesError;
      }

      console.log('All badges fetched:', badges);

      setUserBadges(earnedBadges || []);
      setAllBadges(badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: `Failed to load badges: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const unlockedBadges = userBadges.filter(ub => ub.badges);
  const lockedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading badges...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges ({unlockedBadges.length})
          </h3>
        )}

        {unlockedBadges.length === 0 ? (
          <p className="text-gray-500 text-sm">No badges earned yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((userBadge) => (
              <BadgeDisplay
                key={userBadge.id}
                badge={userBadge.badges}
                earnedAt={userBadge.earned_at || undefined}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Badge Collection
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {unlockedBadges.length}/{allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Badges */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Earned Badges ({unlockedBadges.length})
          </h4>

          {unlockedBadges.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No badges earned yet</p>
              <p className="text-gray-500 text-sm mt-1">Participate in challenges to start earning badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((userBadge) => (
                <div key={userBadge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <BadgeDisplay
                    badge={userBadge.badges}
                    earnedAt={userBadge.earned_at || undefined}
                    size="md"
                    showDescription={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              Available Badges ({lockedBadges.length})
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div key={badge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-gray-200 text-gray-500 border-gray-300 text-sm px-3 py-1.5">
                      <Lock className="h-4 w-4" />
                      <span>{badge.name}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

```text
There are no errors related to `user_id` in the original code provided. The error messages indicate that `submissions.user_id` should be `submissions.participant_id` and `user_badges.awarded_at` should be `user_badges.earned_at`. Since I only have the `BadgeCollection` component, I will focus on fixing the `user_badges.awarded_at` issue.
```

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BadgeDisplay } from './BadgeDisplay';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<"badges">;

export type UserBadgeType = Omit<Tables<"user_badges">, 'awarded_at'> & {
  earned_at: string | null; // Making it non-nullable based on usage
  badges: BadgeType;
};

interface BadgeCollectionProps {
  userId: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  userId,
  showTitle = true,
  compact = false
}) => {
  const [userBadges, setUserBadges] = useState<UserBadgeType[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      console.log('Fetching badges for user:', userId);

      // Fetch user's earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId);

      if (earnedError) {
        console.error('Error fetching user badges:', earnedError);
        throw earnedError;
      }

      console.log('User badges fetched:', earnedBadges);

      // Fetch all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('name');

      if (badgesError) {
        console.error('Error fetching all badges:', badgesError);
        throw badgesError;
      }

      console.log('All badges fetched:', badges);

      // Ensure earnedBadges is an array before setting the state
      setUserBadges(Array.isArray(earnedBadges) ? earnedBadges : []);
      setAllBadges(badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: `Failed to load badges: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const unlockedBadges = userBadges.filter(ub => ub.badges);
  const lockedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading badges...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges ({unlockedBadges.length})
          </h3>
        )}

        {unlockedBadges.length === 0 ? (
          <p className="text-gray-500 text-sm">No badges earned yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((userBadge) => (
              <BadgeDisplay
                key={userBadge.id}
                badge={userBadge.badges}
                earnedAt={userBadge.earned_at || undefined}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Badge Collection
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {unlockedBadges.length}/{allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Badges */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Earned Badges ({unlockedBadges.length})
          </h4>

          {unlockedBadges.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No badges earned yet</p>
              <p className="text-gray-500 text-sm mt-1">Participate in challenges to start earning badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((userBadge) => (
                <div key={userBadge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <BadgeDisplay
                    badge={userBadge.badges}
                    earnedAt={userBadge.earned_at || undefined}
                    size="md"
                    showDescription={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              Available Badges ({lockedBadges.length})
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div key={badge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-gray-200 text-gray-500 border-gray-300 text-sm px-3 py-1.5">
                      <Lock className="h-4 w-4" />
                      <span>{badge.name}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

```text
The type `UserBadgeType` is modified to replace `awarded_at` with `earned_at`, and the state is correctly managed with the modified type.
```

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BadgeDisplay } from './BadgeDisplay';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<"badges">;

export type UserBadgeType = Omit<Tables<"user_badges">, 'awarded_at'> & {
  earned_at: string | null;
  badges: BadgeType;
};

interface BadgeCollectionProps {
  userId: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  userId,
  showTitle = true,
  compact = false
}) => {
  const [userBadges, setUserBadges] = useState<UserBadgeType[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      console.log('Fetching badges for user:', userId);

      // Fetch user's earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge_id,
          badges (*)
        `)
        .eq('user_id', userId);

      if (earnedError) {
        console.error('Error fetching user badges:', earnedError);
        throw earnedError;
      }

      console.log('User badges fetched:', earnedBadges);

      // Fetch all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('name');

      if (badgesError) {
        console.error('Error fetching all badges:', badgesError);
        throw badgesError;
      }

      console.log('All badges fetched:', badges);

      setUserBadges(earnedBadges || []);
      setAllBadges(badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: `Failed to load badges: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const unlockedBadges = userBadges.filter(ub => ub.badges);
  const lockedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading badges...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges ({unlockedBadges.length})
          </h3>
        )}

        {unlockedBadges.length === 0 ? (
          <p className="text-gray-500 text-sm">No badges earned yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((userBadge) => (
              <BadgeDisplay
                key={userBadge.id}
                badge={userBadge.badges}
                earnedAt={userBadge.earned_at || undefined}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Badge Collection
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {unlockedBadges.length}/{allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Badges */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Earned Badges ({unlockedBadges.length})
          </h4>

          {unlockedBadges.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No badges earned yet</p>
              <p className="text-gray-500 text-sm mt-1">Participate in challenges to start earning badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((userBadge) => (
                <div key={userBadge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <BadgeDisplay
                    badge={userBadge.badges}
                    earnedAt={userBadge.earned_at || undefined}
                    size="md"
                    showDescription={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              Available Badges ({lockedBadges.length})
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div key={badge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-gray-200 text-gray-500 border-gray-300 text-sm px-3 py-1.5">
                      <Lock className="h-4 w-4" />
                      <span>{badge.name}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

```text
The code has been modified to use `earned_at` instead of `awarded_at` in the `UserBadgeType` and the `fetchBadges` function. The BadgeDisplay component is also updated to pass in the `earned_at` prop.
```

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BadgeDisplay } from './BadgeDisplay';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<"badges">;

export type UserBadgeType = Omit<Tables<"user_badges">, 'awarded_at'> & {
  earned_at: string | null;
  badges: BadgeType;
};

interface BadgeCollectionProps {
  userId: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  userId,
  showTitle = true,
  compact = false
}) => {
  const [userBadges, setUserBadges] = useState<UserBadgeType[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      console.log('Fetching badges for user:', userId);

      // Fetch user's earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge_id,
          badges (*)
        `)
        .eq('user_id', userId);

      if (earnedError) {
        console.error('Error fetching user badges:', earnedError);
        toast({
          title: "Error",
          description: `Failed to load badges: ${earnedError.message || 'Unknown error'}`,
          variant: "destructive",
        });
        throw earnedError;
      }

      console.log('User badges fetched:', earnedBadges);

      // Fetch all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('name');

      if (badgesError) {
        console.error('Error fetching all badges:', badgesError);
        toast({
          title: "Error",
          description: `Failed to load badges: ${badgesError.message || 'Unknown error'}`,
          variant: "destructive",
        });
        throw badgesError;
      }

      console.log('All badges fetched:', badges);

      setUserBadges(earnedBadges || []);
      setAllBadges(badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: `Failed to load badges: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const unlockedBadges = userBadges.filter(ub => ub.badges);
  const lockedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading badges...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges ({unlockedBadges.length})
          </h3>
        )}

        {unlockedBadges.length === 0 ? (
          <p className="text-gray-500 text-sm">No badges earned yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((userBadge) => (
              <BadgeDisplay
                key={userBadge.id}
                badge={userBadge.badges}
                earnedAt={userBadge.earned_at || undefined}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Badge Collection
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {unlockedBadges.length}/{allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Badges */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Earned Badges ({unlockedBadges.length})
          </h4>

          {unlockedBadges.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No badges earned yet</p>
              <p className="text-gray-500 text-sm mt-1">Participate in challenges to start earning badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((userBadge) => (
                <div key={userBadge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <BadgeDisplay
                    badge={userBadge.badges}
                    earnedAt={userBadge.earned_at || undefined}
                    size="md"
                    showDescription={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              Available Badges ({lockedBadges.length})
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div key={badge.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center opacity-60">
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-gray-200 text-gray-500 border-gray-300 text-sm px-3 py-1.5">
                      <Lock className="h-4 w-4" />
                      <span>{badge.name}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```