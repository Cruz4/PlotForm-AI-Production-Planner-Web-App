
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Construction } from 'lucide-react';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Construction className="mr-3 h-6 w-6" />
            Feature Coming Soon!
          </CardTitle>
          <CardDescription>
            The Teams feature is currently under construction to provide a seamless collaborative experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground p-8">
            <p>We're building a powerful way for you to manage shared workspaces.</p>
            <p>Soon you'll be able to invite members, assign roles, and collaborate on projects in real-time!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
