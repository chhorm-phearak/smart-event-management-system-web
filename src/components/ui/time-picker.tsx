"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatTimeLabel(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function parseValue(value: string | undefined): { hour: number; minute: number; hour12: number; period: "AM" | "PM" } {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) {
    return { hour: 0, minute: 0, hour12: 12, period: "AM" };
  }
  const [h, m] = value.split(":").map(Number);
  const hour = Math.min(23, Math.max(0, h));
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return {
    hour,
    minute: Math.min(59, Math.max(0, m)),
    hour12,
    period,
  };
}

function toHHmm(hour24: number, minute: number): string {
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function to24h(hour12: number, period: "AM" | "PM"): number {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const PERIOD_OPTIONS: { value: "AM" | "PM"; label: string }[] = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

export interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minTime?: string;
  maxTime?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled,
  minTime,
  maxTime,
  className,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 99999,
      });
    }
  }, [open]);
  const parsed = parseValue(value);
  const [pendingHour12, setPendingHour12] = React.useState(parsed.hour12);
  const [pendingPeriod, setPendingPeriod] = React.useState<"AM" | "PM">(parsed.period);
  const [pendingMinute, setPendingMinute] = React.useState(parsed.minute);

  React.useEffect(() => {
    if (open) {
      const p = parseValue(value);
      setPendingHour12(p.hour12);
      setPendingPeriod(p.period);
      setPendingMinute(p.minute);
    }
  }, [open, value]);

  const displayValue = value ? formatTimeLabel(value) : "";
  const pendingHour24 = to24h(pendingHour12, pendingPeriod);

  const commit = (hour24: number, m: number) => {
    const time = toHHmm(hour24, m);
    if (minTime && time < minTime) return;
    if (maxTime && time > maxTime) return;
    onChange?.(time);
  };

  const handleHourChange = (v: string) => {
    const h = Number(v);
    setPendingHour12(h);
    commit(to24h(h, pendingPeriod), pendingMinute);
  };

  const handlePeriodChange = (v: "AM" | "PM") => {
    setPendingPeriod(v);
    commit(to24h(pendingHour12, v), pendingMinute);
  };

  const handleMinuteChange = (v: string) => {
    const m = Number(v);
    setPendingMinute(m);
    commit(pendingHour24, m);
  };

  const hour12Options = React.useMemo(() => {
    if (!minTime && !maxTime) return HOUR_12_OPTIONS;
    return HOUR_12_OPTIONS.filter((h12) => {
      const h24 = to24h(h12, pendingPeriod);
      // For minTime, check if the latest possible time (hour:59) is still valid
      // This allows the hour if minTime is within this hour
      if (minTime && toHHmm(h24, 59) < minTime) return false;
      // For maxTime, check if the earliest possible time (hour:00) is valid
      // This allows the hour if maxTime is within this hour
      if (maxTime && toHHmm(h24, 0) > maxTime) return false;
      return true;
    });
  }, [minTime, maxTime, pendingPeriod]);

  const minuteOptions = React.useMemo(() => {
    if (!minTime && !maxTime) return MINUTE_OPTIONS;
    return MINUTE_OPTIONS.filter((opt) => {
      const m = Number(opt.value);
      const t = toHHmm(pendingHour24, m);
      if (minTime && t < minTime) return false;
      if (maxTime && t > maxTime) return false;
      return true;
    });
  }, [minTime, maxTime, pendingHour24]);

  return (
    <div className={cn("relative", className)}>
      {/* Same style as date field: clickable trigger + icon */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-input bg-transparent px-3 pr-9 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 text-left hover:bg-muted/30",
            !displayValue && "text-muted-foreground",
            ariaInvalid &&
              "border-destructive focus-visible:ring-destructive/20",
            open && "border-ring ring-ring/50 ring-[3px]"
          )}
          aria-invalid={ariaInvalid}
          aria-expanded={open}
        >
          <span className="flex-1 truncate">
            {displayValue || placeholder}
          </span>
        </button>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Clock className="size-4" />
        </span>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {createPortal(
          <div className="w-72 rounded-xl border border-border bg-card shadow-lg overflow-visible" style={dropdownStyle}>
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-semibold text-sm">Select time</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Hour</label>
                  <Select
                    value={String(pendingHour12)}
                    onValueChange={handleHourChange}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="z-[100000]">
                      {hour12Options.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Minute</label>
                  <Select
                    value={String(pendingMinute).padStart(2, "0")}
                    onValueChange={handleMinuteChange}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="z-[100000]">
                      {minuteOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">AM/PM</label>
                  <Select
                    value={pendingPeriod}
                    onValueChange={(v) => handlePeriodChange(v as "AM" | "PM")}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="z-[100000]">
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>,
          document.body
          )}
        </>
      )}
    </div>
  );
}

export { TimePicker, formatTimeLabel };
