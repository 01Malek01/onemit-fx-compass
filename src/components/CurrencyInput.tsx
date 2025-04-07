
import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, RefreshCw } from 'lucide-react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onSubmit: () => void;
  isLoading: boolean;
  autoFocus?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  label, 
  value, 
  onChange, 
  onSubmit,
  isLoading,
  autoFocus = false
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
        onSubmit();
        showSavedIndicator();
      }
    }
  };

  const handleSubmit = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
      onSubmit();
      showSavedIndicator();
    }
  };

  const showSavedIndicator = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  return (
    <Card className="fx-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="text-lg"
            placeholder="Enter rate"
            autoFocus={autoFocus}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSubmit} 
            className="gap-1.5 w-20"
            disabled={isLoading || isSaved}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              "Apply"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter or click Apply to set the rate
        </p>
      </CardContent>
    </Card>
  );
};

export default CurrencyInput;
