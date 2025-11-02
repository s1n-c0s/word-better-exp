import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // 💡 เปลี่ยนสีพื้นหลังเมื่อเปิด (data-[state=checked])
        "peer data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-input focus-visible:border-purple-500 focus-visible:ring-purple-500/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // 💡 กำหนดสี Thumb เมื่อเปิด (data-[state=checked]) ให้เป็นสีขาวเหมือนเดิม
          // และสี Thumb เมื่อปิด (data-[state=unchecked]) ให้เป็นสีม่วงเข้มขึ้นสำหรับ Dark Mode
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
