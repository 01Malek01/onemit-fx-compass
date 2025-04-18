
import React, { useState, useEffect } from 'react';
import { Euro, DollarSign, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

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
  
  useEffect(() => {
    setUsdMarginInput(usdMargin.toString());
    setOtherMarginInput(otherCurrenciesMargin.toString());
  }, [usdMargin, otherCurrenciesMargin]);
  
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
    toast.success("Margin settings updated");
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-800/80 overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Grid layout for side-by-side margins on desktop */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* USD Margin Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-200">
                <div className="p-1 bg-blue-900/30 rounded">
                  <DollarSign className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span>USD Margin</span>
              </div>
              <div className="ml-auto text-xs font-medium text-gray-400">
                {parseFloat(usdMarginInput) || 0}%
              </div>
            </div>
            
            <div className="space-y-2">
              <Slider
                value={[parseFloat(usdMarginInput) || 0]}
                onValueChange={handleUsdSliderChange}
                max={10}
                step={0.05}
                className="py-0.5"
                disabled={isLoading}
              />
              
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={usdMarginInput}
                  onChange={handleUsdMarginChange}
                  className="h-8 px-2 text-right bg-gray-900/70 border-gray-700 text-sm"
                  disabled={isLoading}
                  min="0"
                  max="10"
                  step="0.05"
                />
                <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-400 bg-gray-800/50 rounded border border-gray-700">
                  %
                </div>
              </div>
            </div>
          </div>

          {/* EUR/GBP/CAD Margin Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-200">
                <div className="p-1 bg-indigo-900/30 rounded">
                  <Euro className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span>EUR/GBP/CAD</span>
              </div>
              <div className="ml-auto text-xs font-medium text-gray-400">
                {parseFloat(otherMarginInput) || 0}%
              </div>
            </div>
            
            <div className="space-y-2">
              <Slider
                value={[parseFloat(otherMarginInput) || 0]}
                onValueChange={handleOtherSliderChange}
                max={10}
                step={0.05}
                className="py-0.5"
                disabled={isLoading}
              />
              
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={otherMarginInput}
                  onChange={handleOtherMarginChange}
                  className="h-8 px-2 text-right bg-gray-900/70 border-gray-700 text-sm"
                  disabled={isLoading}
                  min="0"
                  max="10"
                  step="0.05"
                />
                <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-400 bg-gray-800/50 rounded border border-gray-700">
                  %
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Button */}
        <Button
          onClick={handleUpdate}
          className={cn(
            "w-full h-8 text-sm transition-all",
            isSaved ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
          )}
          disabled={isLoading || isSaved}
        >
          <div className="flex items-center gap-1.5">
            {isSaved ? <Check className="h-3.5 w-3.5" /> : null}
            <span>{isSaved ? "Updated Successfully" : "Update Margins"}</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default MarginControls;
