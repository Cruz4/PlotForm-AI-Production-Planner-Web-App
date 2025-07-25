
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Library } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LayoutsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            <Library className="mr-2 h-5 w-5"/>
            Manage Layouts
        </CardTitle>
        <CardDescription>
            This feature has been consolidated. You can now manage your personal layouts directly on the "Edit Structure" page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            <p className="font-semibold">Manage your layouts on the "Edit Structure" page.</p>
            <Button asChild className="mt-4">
                <Link href="/settings/segments">Go to Edit Structure</Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
