
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="dashboard-bg absolute inset-0 -z-10"></div>
      <Card className="bg-card/80 backdrop-blur-sm border-border/40 mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
