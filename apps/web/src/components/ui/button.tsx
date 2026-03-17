import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/85",
				secondary:
					"border border-border bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground",
				outline: "border border-border text-foreground bg-transparent hover:bg-secondary",
				ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				link: "text-primary underline-offset-4 hover:underline",
				glow: "bg-primary text-primary-foreground font-semibold shadow-[0_0_24px_rgba(15,172,237,0.4)] hover:shadow-[0_0_32px_rgba(15,172,237,0.5)] hover:bg-primary/85",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-11 rounded-lg px-6",
				xl: "h-12 rounded-lg px-8 text-base",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";
	return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
