import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Percent, HelpCircle, DollarSign, Euro, PoundSterling, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  isLoading = false
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
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-800/80 overflow-hidden shadow-xl">
      {/* Header with title and info tooltip */}
      <div className="p-4 border-b border-gray-800/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-100">Margin Controls</h2>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" aria-label="Margin information">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs bg-gray-800 text-gray-100 border-gray-700">
              <p>Margins are added to the calculated cost price to determine the final customer-facing rate</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Main content */}
      <div className="p-5">
        <div className="grid gap-6">
          {/* USD Margin Control */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-900/20 rounded">
                <DollarSign className="h-4 w-4 text-blue-400" />
              </div>
              <Label htmlFor="usdMargin" className="font-medium">USD Margin</Label>
              <Badge 
                variant="outline"
                className="ml-auto bg-blue-900/20 px-1.5 py-0 text-xs border-blue-900/40 text-blue-300"
              >
                {parseFloat(usdMarginInput) || 0}%
              </Badge>
            </div>
            
            <div className="space-y-4">
              <Slider 
                id="usd-margin-slider" 
                min={0} 
                max={10} 
                step={0.05} 
                value={[parseFloat(usdMarginInput) || 0]} 
                onValueChange={handleUsdSliderChange} 
                disabled={isLoading}
                className="py-1"
              />
              
              <div className="flex items-center gap-2">
                <Input 
                  id="usdMargin" 
                  type="number" 
                  value={usdMarginInput} 
                  onChange={handleUsdMarginChange} 
                  disabled={isLoading} 
                  min="0" 
                  max="10" 
                  step="0.05" 
                  className="text-right bg-gray-900/70 border-gray-700"
                />
                <div className="flex items-center justify-center text-gray-400 w-8 h-8 bg-gray-800 rounded border border-gray-700">
                  <Percent className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
          
          {/* EUR/GBP/CAD Margin Control */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-1">
                <div className="p-1.5 bg-indigo-900/20 rounded-full z-30">
                  <Euro className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="p-1.5 bg-purple-900/20 rounded-full z-20">
                  <PoundSterling className="h-4 w-4 text-purple-400" />
                </div>
              </div>
              <Label htmlFor="otherMargin" className="font-medium">EUR/GBP/CAD Margin</Label>
              <Badge 
                variant="outline"
                className="ml-auto bg-indigo-900/20 px-1.5 py-0 text-xs border-indigo-900/40 text-indigo-300"
              >
                {parseFloat(otherMarginInput) || 0}%
              </Badge>
            </div>
            
            <div className="space-y-4">
              <Slider 
                id="other-margin-slider" 
                min={0} 
                max={10} 
                step={0.05} 
                value={[parseFloat(otherMarginInput) || 0]} 
                onValueChange={handleOtherSliderChange} 
                disabled={isLoading}
                className="py-1"
              />
              
              <div className="flex items-center gap-2">
                <Input 
                  id="otherMargin" 
                  type="number" 
                  value={otherMarginInput} 
                  onChange={handleOtherMarginChange} 
                  disabled={isLoading} 
                  min="0" 
                  max="10" 
                  step="0.05" 
                  className="text-right bg-gray-900/70 border-gray-700"
                />
                <div className="flex items-center justify-center text-gray-400 w-8 h-8 bg-gray-800 rounded border border-gray-700">
                  <Percent className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Update Button */}
        <Button 
          onClick={handleUpdate} 
          className={cn(
            "w-full mt-6 relative overflow-hidden transition-all",
            isSaved ? "bg-green-600 text-white hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
          )}
          disabled={isLoading || isSaved}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-1.5" /> 
              Margins Updated
            </>
          ) : (
            "Update Margins"
          )}
        </Button>
      </div>
    </div>
  );
};

export default MarginControls;