import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  className?: string;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-sky-600 bg-sky-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-sky-700 active:scale-95 shadow-md hover:shadow-sky-200",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2 transition-all duration-300 group-hover:translate-x-1">
        <span>{children || text}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
