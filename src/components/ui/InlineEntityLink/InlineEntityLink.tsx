import React from "react";
import Link from "next/link";

export function InlineEntityLink({
  href,
  children,
  title,
}: {
  href: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={[
        "link link-hover",
        "font-semibold",
        "decoration-base-content/30",
        "underline-offset-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
