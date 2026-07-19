import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "border-teal bg-teal text-teal-fg hover:opacity-95 disabled:opacity-50",
  secondary:
    "border-line bg-elevated text-ink hover:bg-canvas disabled:opacity-50",
  danger:
    "border-danger bg-elevated text-danger hover:bg-cost-soft disabled:opacity-50",
  ghost: "border-transparent bg-transparent text-muted hover:text-ink",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={[
        "cursor-pointer rounded-lg border px-4 py-2 text-sm transition-opacity",
        styles[variant],
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
