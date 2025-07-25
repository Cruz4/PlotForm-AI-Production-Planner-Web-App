
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Loader2, Calendar, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEpisodesForUserFromDb } from '@/lib/episodeStore';
import type { Episode } from '@/types';
import { format, formatDistance, differenceInDays, getDay } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            setIsLoading(true);
            getAllEpisodesForUserFromDb(user.uid)
                .then(setEpisodes)
                .finally(() => setIsLoading(false));
        } else if (!user) {
            setIsLoading(false);
        }
    }, [user]);

    const stats = useMemo(() => {
        if (episodes.length === 0) {
            return {
                totalEpisodes: 0,
                avgTimeToPublish: 'N/A',
                mostProductiveDay: 'N/A',
                aiGeneratedCount: 0,
                creationByDay: []
            };
        }

        const publishedEpisodes = episodes.filter(ep => ep.dateUploaded && ep.createdAt);
        const timeToPublishDurations = publishedEpisodes.map(ep =>
            differenceInDays(new Date(ep.dateUploaded!), new Date(ep.createdAt))
        );
        const avgTimeToPublishDays = timeToPublishDurations.length > 0
            ? Math.round(timeToPublishDurations.reduce((a, b) => a + b, 0) / timeToPublishDurations.length)
            : 0;

        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
        episodes.forEach(ep => {
            const dayOfWeek = getDay(new Date(ep.createdAt));
            dayCounts[dayOfWeek]++;
        });
        const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const mostProductiveDay = dayCounts[maxDayIndex] > 0 ? days[maxDayIndex] : 'N/A';

        const aiGeneratedCount = episodes.filter(ep => ep.isAiGenerated).length;
        
        const creationByDay = days.map((day, index) => ({ name: day.substring(0, 3), total: dayCounts[index] }));

        return {
            totalEpisodes: episodes.length,
            avgTimeToPublish: avgTimeToPublishDays > 0 ? `${avgTimeToPublishDays} days` : 'N/A',
            mostProductiveDay,
            aiGeneratedCount,
            creationByDay,
        };
    }, [episodes]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (episodes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5"/> Personal Analytics</CardTitle>
                    <CardDescription>Gain insights into your creative workflow and productivity.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground p-8">
                    <p>No data to analyze yet. Create some items to see your stats!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5"/> Personal Analytics</CardTitle>
                    <CardDescription>An overview of your creative workflow and productivity.</CardDescription>
                </CardHeader>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Items Created" value={stats.totalEpisodes} icon={Calendar} />
                <StatCard title="Avg. Time to Publish" value={stats.avgTimeToPublish} icon={Clock} />
                <StatCard title="Most Productive Day" value={stats.mostProductiveDay} icon={Calendar} />
                <StatCard title="AI-Generated Items" value={stats.aiGeneratedCount} icon={Sparkles} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Creation Activity</CardTitle>
                    <CardDescription>A summary of when you create new items.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stats.creationByDay}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                                cursor={{fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
