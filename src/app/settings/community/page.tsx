// src/app/settings/community/page.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Construction } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Construction className="mr-3 h-6 w-6" />
            Feature Coming Soon!
          </CardTitle>
          <CardDescription>
            The Community and Planner Pals features are currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground p-8">
            <p>We're working hard to build a great space for creators to connect.</p>
            <p>Check back soon to find Planner Pals and see community activity!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
