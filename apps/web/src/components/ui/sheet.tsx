"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				"fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				className,
			)}
			{...props}
		/>
	);
}

const sheetVariants = cva(
	"fixed z-50 border border-border bg-card/95 backdrop-blur-xl shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
	{
		variants: {
			side: {
				top: "inset-x-0 top-0 rounded-b-2xl data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
				bottom:
					"inset-x-0 bottom-0 rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
				left: "inset-y-0 left-0 h-full w-3/4 max-w-sm rounded-r-2xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
				right:
					"inset-y-0 right-0 h-full w-3/4 max-w-sm rounded-l-2xl data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
			},
		},
		defaultVariants: {
			side: "right",
		},
	},
);

function SheetContent({
	side = "right",
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & VariantProps<typeof sheetVariants>) {
	return (
		<SheetPortal>
			<SheetOverlay />
			<DialogPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
				<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
					<X className="size-4" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
				{children}
			</DialogPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("text-lg font-bold text-foreground", className)}
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetPortal,
	SheetOverlay,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
};
