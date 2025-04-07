
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Percent, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';

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

  const handleUsdSliderChange = (value: number[]) => {
    setUsdMarginInput(value[0].toString());
  };

  const handleOtherMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherMarginInput(e.target.value);
  };

  const handleOtherSliderChange = (value: number[]) => {
    setOtherMarginInput(value[0].toString());
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

  useEffect(() => {
    setUsdMarginInput(usdMargin.toString());
    setOtherMarginInput(otherCurrenciesMargin.toString());
  }, [usdMargin, otherCurrenciesMargin]);

  return (
    <Card className="fx-card relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" 
        aria-hidden="true"
      />
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>Margin Controls</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Margin information">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Margins are added to the calculated cost price to determine the final customer-facing rate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="usdMargin" className="text-sm font-medium">USD Margin</Label>
                <div className="bg-primary/20 rounded-full px-2 py-0.5 text-xs font-medium flex items-center">
                  <Percent className="h-3 w-3 mr-0.5" />
                  {parseFloat(usdMarginInput).toFixed(1)}%
                </div>
              </div>
              <Slider 
                id="usd-margin-slider"
                min={0} 
                max={10} 
                step={0.1} 
                value={[parseFloat(usdMarginInput) || 0]} 
                onValueChange={handleUsdSliderChange}
                disabled={isLoading}
              />
            </div>
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
                className="text-right"
              />
              <span className="flex items-center text-muted-foreground text-sm min-w-[16px]">%</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="otherMargin" className="text-sm font-medium">EUR/GBP/CAD Margin</Label>
                <div className="bg-primary/20 rounded-full px-2 py-0.5 text-xs font-medium flex items-center">
                  <Percent className="h-3 w-3 mr-0.5" />
                  {parseFloat(otherMarginInput).toFixed(1)}%
                </div>
              </div>
              <Slider 
                id="other-margin-slider"
                min={0} 
                max={10} 
                step={0.1} 
                value={[parseFloat(otherMarginInput) || 0]} 
                onValueChange={handleOtherSliderChange}
                disabled={isLoading}
              />
            </div>
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
                className="text-right"
              />
              <span className="flex items-center text-muted-foreground text-sm min-w-[16px]">%</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleUpdate} 
          className="w-full mt-6 relative overflow-hidden group"
          disabled={isLoading || isSaved}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-1.5" /> Saved Successfully
            </>
          ) : (
            "Update Margins"
          )}
          <span className="absolute inset-0 w-full h-full bg-white/10 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarginControls;
