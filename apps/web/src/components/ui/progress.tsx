"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({
	className,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
	return (
		<ProgressPrimitive.Root
			className={cn("relative h-3 w-full overflow-hidden rounded-full bg-muted", className)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				className="h-full rounded-full bg-gradient-to-r from-primary to-fang-purple transition-all duration-500"
				style={{ width: `${value ?? 0}%` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
