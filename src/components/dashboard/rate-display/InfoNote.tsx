
import React from 'react';
import { Info } from 'lucide-react';

const InfoNote: React.FC = () => {
  return (
    <div className="mt-2 text-xs flex items-center gap-1.5 text-muted-foreground">
      <Info className="h-3.5 w-3.5" />
      <span>Rates are fetched through a secure server proxy to avoid CORS issues. </span>
    </div>
  );
};

export default InfoNote;
