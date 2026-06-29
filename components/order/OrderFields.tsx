"use client";

/**
 * Reusable order form field groups.
 * Used by both the dialog (OrderFormDialog) and the inline chat form (ChatOrderForm).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, MapPin, Truck, User, CalendarIcon } from "lucide-react"; // no animated version
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { OrderFormData } from "./types";
import { todayLK } from "./types";

type Props = {
  data: OrderFormData;
  onChange: <K extends keyof OrderFormData>(
    key: K,
    value: OrderFormData[K],
  ) => void;
  isCake: boolean;
  error: string | null;
};

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 shrink-0">
      <span className="text-primary">{icon}</span>
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {title}
    </p>
  </div>
);

const FieldRow = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

export function OrderDetailsFields({
  data,
  onChange,
  isCake,
}: Pick<Props, "data" | "onChange" | "isCake">) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<Gift className="w-3.5 h-3.5" />}
        title="Order Details"
      />
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-20 shrink-0">Quantity</Label>
        <Input
          type="number"
          min={1}
          max={99}
          value={data.quantity}
          onChange={(e) =>
            onChange("quantity", Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-24"
        />
      </div>

      {isCake && (
        <FieldRow label="Cake icing text">
          <Input
            placeholder="e.g. Happy Birthday John!"
            maxLength={120}
            value={data.icingText}
            onChange={(e) => onChange("icingText", e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Optional · max 120 characters
          </p>
        </FieldRow>
      )}

      <FieldRow label="Gift message">
        <Textarea
          placeholder="A personal note to include with this order…"
          maxLength={300}
          rows={2}
          value={data.giftMessage}
          onChange={(e) => onChange("giftMessage", e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Optional · max 300 characters
        </p>
      </FieldRow>
    </div>
  );
}

export function RecipientFields({
  data,
  onChange,
}: Pick<Props, "data" | "onChange">) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<User className="w-3.5 h-3.5" />}
        title="Recipient"
      />
      <FieldRow label="Full name" required>
        <Input
          placeholder="Who is receiving this?"
          value={data.recipientName}
          onChange={(e) => onChange("recipientName", e.target.value)}
        />
      </FieldRow>
      <FieldRow label="Phone number" required>
        <Input
          placeholder="077 123 4567 or +94771234567"
          value={data.recipientPhone}
          onChange={(e) => onChange("recipientPhone", e.target.value)}
        />
      </FieldRow>
    </div>
  );
}

export function DeliveryFields({
  data,
  onChange,
}: Pick<Props, "data" | "onChange">) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<Truck className="w-3.5 h-3.5" />}
        title="Delivery"
      />
      <FieldRow label="Street address" required>
        <Input
          placeholder="123 Main Street, Area"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="City" required>
          <Input
            placeholder="e.g. Colombo 03"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Location type">
          <Select
            value={data.locationType}
            onValueChange={(v) =>
              onChange(
                "locationType",
                (v as OrderFormData["locationType"]) ?? "house",
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="office">Office</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>

      <FieldRow label="Delivery date" required>
        <Popover>
          <PopoverTrigger 
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data.deliveryDate && "text-muted-foreground"
                )}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {data.deliveryDate ? (
              format(parse(data.deliveryDate, "yyyy-MM-dd", new Date()), "PPP")
            ) : (
              <span>Pick a date</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                data.deliveryDate
                  ? parse(data.deliveryDate, "yyyy-MM-dd", new Date())
                  : undefined
              }
              onSelect={(date) => {
                if (date) {
                  onChange("deliveryDate", format(date, "yyyy-MM-dd"));
                }
              }}
              disabled={(date) => {
                const todayStr = todayLK();
                return format(date, "yyyy-MM-dd") < todayStr;
              }}
            />
          </PopoverContent>
        </Popover>
      </FieldRow>

      <FieldRow label="Delivery instructions">
        <Input
          placeholder="e.g. Call before arriving"
          value={data.instructions}
          onChange={(e) => onChange("instructions", e.target.value)}
        />
      </FieldRow>
    </div>
  );
}

export function SenderFields({
  data,
  onChange,
}: Pick<Props, "data" | "onChange">) {
  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<MapPin className="w-3.5 h-3.5" />}
        title="From (Sender)"
      />
      <FieldRow label="Your name" required>
        <Input
          placeholder="Sender's name"
          value={data.senderName}
          onChange={(e) => onChange("senderName", e.target.value)}
        />
      </FieldRow>
      <div className="flex items-center gap-2.5 pt-1">
        <Checkbox
          id="anon-field"
          checked={data.anonymous}
          onCheckedChange={(v) => onChange("anonymous", v === true)}
        />
        <Label
          htmlFor="anon-field"
          className="font-normal cursor-pointer text-sm leading-snug"
        >
          Send anonymously — gift card shows &quot;Anonymous&quot;
        </Label>
      </div>
    </div>
  );
}
