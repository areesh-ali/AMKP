import type { FormHTMLAttributes, ReactNode } from "react";

export function FormCard({
  title,
  children,
  ...form
}: FormHTMLAttributes<HTMLFormElement> & {
  title: string;
  children: ReactNode;
}) {
  return (
    <form
      className="rounded-xl border border-line bg-elevated p-4"
      {...form}
    >
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </form>
  );
}
