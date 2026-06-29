"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Languages,
  PackageCheck,
  Gift,
  Check,
  Zap,
  ImagePlus,
} from "lucide-react";
import {  useState } from "react";
import Image from "next/image";

const FEATURES = [
  {
    icon: Languages,
    title: "English, Sinhala & Tamil Support",
    description:
      "(Tanglish and Singlish also supported) Chat, search, and interact with Kapruka Buddy using your preferred language seamlessly.",
    badge: "beta",
  },
  {
    icon: ImagePlus,
    title: "Visual AI Search",
    description:
      "Upload a picture of a product (like a cake or flowers), and Gemini Vision will instantly find it in our store.",
    badge: "New",
  },
  {
    icon: PackageCheck,
    title: "Smart Shopping & Tracking",
    description:
      "Instantly navigate Kapruka's massive catalog, check order statuses, and get delivery help.",
  },
  {
    icon: Gift,
    title: "Seamless Gift Messaging",
    description:
      "Add beautiful, personalized gift messages to your orders right from the chat before you checkout.",
  },
];

export function KaprukaBuddyFeaturesDialog() {
  const localStorageFirstTime = localStorage.getItem("featuresDialogOpen");
  const [open, setOpen] = useState(localStorageFirstTime === null);
  const [renderTime, setRenderTime] = useState<number | undefined>(undefined);
  const onOpenChange = (open: boolean) => {
    setOpen(open);
    localStorage.setItem("featuresDialogOpen", "false");
    if (open) {
      setRenderTime(Date.now());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="default">
            <Zap />
            Features
          </Button>
        }
      />
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Sticky header ── */}
        <div className="shrink-0 border-b px-6 py-5 bg-muted/30">
          <div className="flex items-start gap-4 motion-preset-shrink">
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center shrink-0  ">
                <Image
                  src={`/animated-logo.gif?v=${renderTime}`}
                  alt="Kapruka Buddy"
                  height={120}
                  width={120}
                  unoptimized
                />
            </div>
            <div className="min-w-0">
              <DialogHeader>
                <DialogTitle className="text-lg leading-snug">
                  Meet Kapruka Buddy
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Your smart AI shopping assistant is here to make gifting to
                  Sri Lanka easier than ever.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* ── Scrollable features list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="space-y-5">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex gap-4 motion-preset-blur-down">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      {feature.title}
                      {feature.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                          {feature.badge}
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div className="shrink-0 border-t bg-background px-6 py-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Check className="w-3 h-3 text-green-500" />
            Always ready to assist you 24/7
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              className="flex-1 w-full"
              onClick={() => onOpenChange(false)}
            >
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
