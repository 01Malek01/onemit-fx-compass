
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface MarginControlsProps {
  usdMargin: number;
  otherCurrenciesMargin: number;
  onUpdate: (usdMargin: number, otherCurrenciesMargin: number) => void;
  isLoading?: boolean;
}

const MarginControls: React.FC<MarginControlsProps> = ({
  usdMargin,
  otherCurrenciesMargin,
  onUpdate,
  isLoading = false,
}) => {
  const [usdMarginInput, setUsdMarginInput] = useState<string>(usdMargin.toString());
  const [otherMarginInput, setOtherMarginInput] = useState<string>(otherCurrenciesMargin.toString());
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleUsdMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsdMarginInput(e.target.value);
  };

  const handleOtherMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherMarginInput(e.target.value);
  };

  const handleUpdate = () => {
    const usdMarginValue = parseFloat(usdMarginInput);
    const otherMarginValue = parseFloat(otherMarginInput);
    
    if (!isNaN(usdMarginValue) && !isNaN(otherMarginValue)) {
      onUpdate(usdMarginValue, otherMarginValue);
      showSavedIndicator();
    }
  };

  const showSavedIndicator = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  React.useEffect(() => {
    setUsdMarginInput(usdMargin.toString());
    setOtherMarginInput(otherCurrenciesMargin.toString());
  }, [usdMargin, otherCurrenciesMargin]);

  return (
    <Card className="fx-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Margin Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usdMargin">USD Margin (%)</Label>
            <div className="flex gap-2">
              <Input
                id="usdMargin"
                type="number"
                value={usdMarginInput}
                onChange={handleUsdMarginChange}
                disabled={isLoading}
                min="0"
                max="100"
                step="0.1"
              />
              <span className="flex items-center text-muted-foreground text-sm">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="otherMargin">EUR/GBP/CAD Margin (%)</Label>
            <div className="flex gap-2">
              <Input
                id="otherMargin"
                type="number"
                value={otherMarginInput}
                onChange={handleOtherMarginChange}
                disabled={isLoading}
                min="0"
                max="100"
                step="0.1"
              />
              <span className="flex items-center text-muted-foreground text-sm">%</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleUpdate} 
          className="w-full mt-4"
          disabled={isLoading || isSaved}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-1.5" /> Saved
            </>
          ) : (
            "Update Margins"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarginControls;
