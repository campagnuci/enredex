import { cn } from "@/lib/utils";
import { Separator as RadixSeparator } from "@radix-ui/react-separator";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";

export const Separator = forwardRef<
  ElementRef<typeof RadixSeparator>,
  ComponentPropsWithoutRef<typeof RadixSeparator>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <RadixSeparator
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className,
    )}
    {...props}
  />
));
Separator.displayName = RadixSeparator.displayName;
