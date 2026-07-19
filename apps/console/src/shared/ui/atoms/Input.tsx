import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
};

export function Input({ mono, className = "", ...rest }: Props) {
  return (
    <input
      className={[
        "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-teal",
        mono ? "font-mono text-[13px]" : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
