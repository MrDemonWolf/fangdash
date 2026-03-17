import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
	{
		variants: {
			variant: {
				default: "border-primary/30 bg-primary/10 text-primary",
				secondary: "border-border bg-muted text-muted-foreground",
				outline: "border-border text-foreground",
				destructive: "border-destructive/30 bg-destructive/10 text-destructive",
				gold: "border-yellow-500/30 bg-yellow-500/20 text-yellow-400",
				silver: "border-gray-300/30 bg-gray-300/20 text-gray-300",
				bronze: "border-amber-700/30 bg-amber-700/20 text-amber-600",
				purple: "border-purple-400/30 bg-purple-400/10 text-purple-400",
				orange: "border-fang-orange/30 bg-fang-orange/10 text-fang-orange",
				emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
				level: "border-primary/30 bg-primary/10 font-mono text-[10px] text-primary",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
