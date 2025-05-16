import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  compareRates,
  calculateDifference,
} from "@/utils/currencyUtils";
import { Badge } from "@/components/ui/badge";
import CurrencyFlag from "@/components/CurrencyFlag";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Rate {
  buy: number;
  sell: number;
}

interface ComparisonTableProps {
  currencyCode: string;
  oneremitRates: Rate;
  vertoFxRates: Rate;
  isLoading?: boolean;
  isUsingDefaultRates?: boolean;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currencyCode,
  oneremitRates,
  vertoFxRates,
  isLoading = false,
  isUsingDefaultRates = false,
}) => {
  // Define default values based on currency
  const getDefaultRates = (currency: string): Rate => {
    switch (currency) {
      case "USD":
        return { buy: 1635, sell: 1600 };
      case "EUR":
        return { buy: 1870, sell: 1805 };
      case "GBP":
        return { buy: 2150, sell: 2080 };
      case "CAD":
        return { buy: 1190, sell: 1140 };
      default:
        return { buy: 1600, sell: 1550 };
    }
  };

  // Safety check for valid rates with currency-specific defaults
  const safeOneremitRates = {
    buy: oneremitRates?.buy || 0,
    sell: oneremitRates?.sell || 0,
  };

  const defaultRates = getDefaultRates(currencyCode);
  const safeVertoRates = {
    buy: vertoFxRates?.buy > 0 ? vertoFxRates.buy : defaultRates.buy,
    sell: vertoFxRates?.sell > 0 ? vertoFxRates.sell : defaultRates.sell,
  };

  const getBuyRateComparison = () => {
    try {
      // If oneremit rate is 0 or missing, just show placeholder
      if (!safeOneremitRates.buy) {
        return (
          <div className="text-base md:text-lg font-medium animate-fade-in">
            -
          </div>
        );
      }

      // If verto rate is 0 or missing, just show the oneremit rate without comparison
      if (!safeVertoRates.buy) {
        return (
          <div className="text-base md:text-lg font-medium animate-fade-in">
            {formatCurrency(safeOneremitRates.buy, "NGN")}
          </div>
        );
      }

      // Both rates available, do the comparison
      const isBetter = compareRates(
        safeOneremitRates.buy,
        safeVertoRates.buy,
        true
      );
      const diff = calculateDifference(
        safeOneremitRates.buy,
        safeVertoRates.buy
      );

      return (
        <div
          className={`${
            isBetter ? "rate-better" : "rate-worse"
          } animate-slide-in`}
        >
          <div
            className={cn(
              "text-base md:text-lg font-medium",
              isBetter ? "text-emerald-400" : "text-gray-100"
            )}
          >
            {formatCurrency(safeOneremitRates.buy, "NGN")}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    "text-xs mt-1 gap-1 font-medium shadow-sm",
                    isBetter
                      ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 border-green-600/20"
                      : "bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-600/20"
                  )}
                >
                  {isBetter ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isNaN(diff) ? "0.00" : Math.abs(diff).toFixed(2)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-gray-800/95 text-gray-100 border-gray-700"
              >
                <p className="text-xs sm:text-sm">
                  {isBetter ? "Better than" : "Worse than"} VertoFX by{" "}
                  {isNaN(diff) ? "0.00" : Math.abs(diff).toFixed(2)}%
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    } catch (error) {
      console.error(
        `Error rendering buy rate comparison for ${currencyCode}:`,
        error
      );
      return (
        <div className="text-base md:text-lg font-medium animate-fade-in">
          {formatCurrency(safeOneremitRates.buy || 0, "NGN")}
        </div>
      );
    }
  };

  const getSellRateComparison = () => {
    // Display 0 NGN for sell rates as requested
    return (
      <div className="animate-fade-in">
        <div className="text-base md:text-lg font-medium text-gray-200">
          NGN 0.00
        </div>
      </div>
    );
  };

  // Function to format VertoFX rates with handling for 0 values
  const formatVertoRate = (rate: number) => {
    if (!rate) return "-"; // Show dash for missing rates
    return formatCurrency(rate, "NGN");
  };

  // Handle errors in the entire component render
  try {
    return (
      <div className="h-full">
        <div
          className={cn(
            "flex flex-col h-full",
            isUsingDefaultRates ? "opacity-90" : "opacity-100"
          )}
        >
          {/* Header with currency and flag */}
          <div className="border-b border-gray-800 p-2 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative">
                <CurrencyFlag
                  currency={currencyCode}
                  className="w-5 h-5 sm:w-7 sm:h-7 rounded shadow-sm"
                />
                {isUsingDefaultRates && (
                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2"></div>
                )}
              </div>
              <div className="text-sm sm:text-base font-semibold text-gray-100">
                NGN/{currencyCode} Comparison
              </div>
            </div>

            {isUsingDefaultRates && (
              <Badge
                variant="outline"
                className="bg-red-900/30 border-red-800/40 text-red-200 text-xs px-1.5 py-0.5"
              >
                Default
              </Badge>
            )}
          </div>

          {/* Table content */}
          <div className="p-2 sm:p-4 flex-grow">
            {isLoading ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 opacity-60">
                  <div className="h-7 w-20 rounded-md bg-gray-700/40 animate-pulse"></div>
                  <div className="h-7 w-28 rounded-md bg-gray-700/40 animate-pulse"></div>
                </div>
                <div className="h-14 rounded-md bg-gray-700/30 animate-pulse"></div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                {/* Column headers */}
                <div className="grid grid-cols-3 text-2xs xs:text-xs font-medium text-gray-400 pb-1 sm:pb-2">
                  <div>Provider</div>
                  <div>
                    Buy Rate
                    <br />
                    <span className="text-[8px] sm:text-[10px]">
                      (NGN → {currencyCode})
                    </span>
                  </div>
                  <div>
                    Sell Rate
                    <br />
                    <span className="text-[8px] sm:text-[10px]">
                      ({currencyCode} → NGN)
                    </span>
                  </div>
                </div>

                {/* Oneremit row */}
                <div
                  className={cn(
                    "grid grid-cols-3 items-center py-2 sm:py-3 rounded-md",
                    "bg-gradient-to-r from-blue-900/10 via-blue-800/10 to-blue-900/5",
                    "border border-blue-900/30"
                  )}
                >
                  <div className="text-xs sm:text-sm font-medium text-blue-100 flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2">
                    <div className="bg-blue-900/50 h-4 w-4 sm:h-5 sm:w-5 rounded-sm flex items-center justify-center">
                      <span className="text-2xs sm:text-xs font-bold text-blue-300">
                        O
                      </span>
                    </div>
                    <span className="truncate">Oneremit</span>
                  </div>
                  <div>{getBuyRateComparison()}</div>
                  <div>{getSellRateComparison()}</div>
                </div>

                {/* VertoFX row */}
                <div
                  className={cn(
                    "grid grid-cols-3 items-center py-2 sm:py-3 px-1 sm:px-2 rounded-md",
                    "bg-gradient-to-r from-gray-800/40 to-gray-800/20",
                    "border border-gray-700/40"
                  )}
                >
                  <div className="text-xs sm:text-sm font-medium text-gray-300 flex items-center gap-1 sm:gap-1.5">
                    <div className="bg-gray-700/70 h-4 w-4 sm:h-5 sm:w-5 rounded-sm flex items-center justify-center">
                      <span className="text-2xs sm:text-xs font-bold text-gray-300">
                        V
                      </span>
                    </div>
                    <span className="truncate">VertoFX</span>
                  </div>
                  <div className="text-base md:text-lg font-medium text-gray-300">
                    {formatVertoRate(safeVertoRates.buy)}
                  </div>
                  <div className="text-base md:text-lg font-medium text-gray-300">
                    {formatVertoRate(safeVertoRates.sell)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error(
      `Critical error rendering ComparisonTable for ${currencyCode}:`,
      error
    );
    // Fallback UI that won't crash
    return (
      <div className="border border-red-700 bg-red-900/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h3 className="font-medium">Data Display Error</h3>
        </div>
        <p className="text-xs sm:text-sm text-red-300 mt-2">
          Unable to display {currencyCode} comparison data
        </p>
      </div>
    );
  }
};

export default ComparisonTable;
