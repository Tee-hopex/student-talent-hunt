import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex flex-wrap gap-2 overflow-x-auto pb-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "shrink-0 rounded-full border-2 border-ink px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors",
        "data-[state=inactive]:bg-white data-[state=inactive]:text-ink data-[state=inactive]:hover:bg-ink/5",
        "data-[state=active]:bg-ink data-[state=active]:text-cream",
        className,
      )}
      {...props}
    />
  );
}
