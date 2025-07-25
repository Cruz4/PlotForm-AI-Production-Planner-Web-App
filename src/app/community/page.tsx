// src/app/community/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getActivityForPals } from '@/lib/activityStore';
import { getPlannerPals } from '@/lib/plannerPalStore';
import type { PublicActivity } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState<PublicActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const pals = await getPlannerPals(user.uid);
        const palIds = pals
          .filter(p => p.status === 'accepted')
          .map(p => p.userIds.find(id => id !== user.uid))
          .filter(Boolean) as string[];
        
        // Also include user's own public activity
        palIds.push(user.uid);

        if (palIds.length > 0) {
          const palActivity = await getActivityForPals(palIds);
          setActivity(palActivity);
        } else {
          setActivity([]);
        }
      } catch (error) {
        console.error("Failed to fetch activity feed:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getActivityText = (item: PublicActivity) => {
    const name = item.userId === user?.uid ? 'You' : item.userName || 'A user';
    const actionText = 'published a new item';
    const itemLink = `/dashboard/episode/${item.itemId}`;

    return (
      <>
        <span className="font-semibold">{name}</span> {actionText}:{' '}
        <Link href={itemLink} className="text-primary hover:underline font-semibold">
          {item.itemName}
        </Link>
      </>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5"/>Community Activity</CardTitle>
          <CardDescription>See what your Planner Pals and the community are up to.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary"/>
        </CardContent>
      </Card>
    );
  }

  if (activity.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5"/>Community Activity</CardTitle>
          <CardDescription>Updates from your Planner Pals will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground space-y-4">
          <p>No recent activity. <Link href="/settings/community" className="text-primary hover:underline font-semibold">Find some Planner Pals</Link> to see what your community is up to!</p>
          <p>You can also make your own episodes public from their respective edit pages to share them with your pals.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5"/>Community Activity</CardTitle>
        <CardDescription>See what your Planner Pals and the community are up to.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activity.map(item => (
            <li key={item.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.userPhotoURL || undefined} />
                <AvatarFallback>{item.userName?.substring(0, 1) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">{getActivityText(item)}</p>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <ActivityFeed />
    </div>
  )
}
