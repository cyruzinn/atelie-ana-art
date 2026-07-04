import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  label?: string;
  className?: string;
}

/**
 * Technical drafting-paper frame. Fixed identity element around content.
 */
export function BlueprintFrame({ children, label, className = "" }: Props) {
  return (
    <div className={`relative border border-border ${className}`}>
      {/* corner ticks */}
      <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-foreground" />
      <span className="absolute -right-px -top-px h-2 w-2 border-r border-t border-foreground" />
      <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-foreground" />
      <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-foreground" />
      {label && (
        <span className="absolute -top-2 left-3 bg-background px-2 text-technical">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
