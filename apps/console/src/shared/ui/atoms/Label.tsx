import type { LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={["mb-1 block text-[12px] font-medium text-muted", className].join(
        " ",
      )}
      {...rest}
    />
  );
}
