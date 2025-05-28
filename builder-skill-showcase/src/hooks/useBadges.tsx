import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type BadgeType = Tables<"badges">;

export const useBadges = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const awardBadge = useCallback(async (
    userId: string, 
    badgeId: string, 
    challengeId?: string
  ) => {
    setLoading(true);
    try {
      // Check if user already has this badge
      const { data: existingBadge, error: checkError } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingBadge) {
        console.log('User already has this badge');
        return false;
      }

      // Award the badge
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          challenge_id: challengeId,
          earned_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Get badge details for notification
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('name')
        .eq('id', badgeId)
        .single();

      if (badgeError) throw badgeError;

      toast({
        title: "Badge Earned! 🏆",
        description: `You've earned the "${badge.name}" badge!`,
      });

      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      toast({
        title: "Error",
        description: "Failed to award badge",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkAndAwardBadges = useCallback(async (
    userId: string, 
    event: 'first_submission' | 'challenge_completion' | 'high_score',
    data?: { challengeId?: string; score?: number }
  ) => {
    try {
      // Fetch relevant badges
      const { data: badges, error } = await supabase
        .from('badges')
        .select('*');

      if (error) throw error;

      const badgesToCheck = badges.filter(badge => {
        const criteria = badge.criteria as any;
        if (!criteria) return false;

        switch (event) {
          case 'first_submission':
            return badge.badge_type === 'first_submission';
          case 'challenge_completion':
            return badge.badge_type === 'challenge_winner';
          case 'high_score':
            return badge.badge_type === 'perfectionist' && 
                   data?.score && data.score >= (criteria.min_score || 90);
          default:
            return false;
        }
      });

      // Award applicable badges
      for (const badge of badgesToCheck) {
        await awardBadge(userId, badge.id, data?.challengeId);
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  }, [awardBadge]);

  return {
    awardBadge,
    checkAndAwardBadges,
    loading,
  };
};