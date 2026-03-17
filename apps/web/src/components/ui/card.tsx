import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("rounded-xl border border-border bg-card", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex items-center justify-between border-b border-border px-5 py-3",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
	return (
		<h3
			className={cn(
				"text-xs font-medium uppercase tracking-wider text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
	return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("p-5", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex items-center border-t border-border px-5 py-3", className)}
			{...props}
		/>
	);
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
