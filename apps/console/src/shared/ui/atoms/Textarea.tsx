import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "min-h-[72px] w-full resize-none border-0 bg-transparent text-[15px] outline-none",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
