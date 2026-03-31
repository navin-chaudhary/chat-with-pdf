"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MdProps = ComponentPropsWithoutRef<typeof ReactMarkdown>;

function mergeClass(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

const proseBase =
  "text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0";

export function ChatMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const components: MdProps["components"] = {
    h1: ({ children, className: cn }) => (
      <h2
        className={mergeClass(
          "mb-2 mt-4 border-b border-zinc-200 pb-1 text-base font-semibold tracking-tight text-zinc-900 first:mt-0 dark:border-zinc-700 dark:text-zinc-50",
          cn,
        )}
      >
        {children}
      </h2>
    ),
    h2: ({ children, className: cn }) => (
      <h3
        className={mergeClass(
          "mb-2 mt-3 text-[0.95rem] font-semibold text-zinc-900 first:mt-0 dark:text-zinc-50",
          cn,
        )}
      >
        {children}
      </h3>
    ),
    h3: ({ children, className: cn }) => (
      <h4
        className={mergeClass(
          "mb-1.5 mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100",
          cn,
        )}
      >
        {children}
      </h4>
    ),
    p: ({ children, className: cn }) => (
      <p className={mergeClass("my-2 first:mt-0 last:mb-0", cn)}>{children}</p>
    ),
    ul: ({ children, className: cn }) => (
      <ul
        className={mergeClass(
          "my-2 list-disc space-y-1.5 pl-5 marker:text-emerald-700/90 first:mt-0 last:mb-0 dark:marker:text-emerald-400/90",
          cn,
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children, className: cn }) => (
      <ol
        className={mergeClass(
          "my-2 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-zinc-600 first:mt-0 last:mb-0 dark:marker:text-zinc-400",
          cn,
        )}
      >
        {children}
      </ol>
    ),
    li: ({ children, className: cn }) => (
      <li className={mergeClass("[&>p]:my-0", cn)}>{children}</li>
    ),
    strong: ({ children, className: cn }) => (
      <strong
        className={mergeClass(
          "font-semibold text-zinc-950 dark:text-white",
          cn,
        )}
      >
        {children}
      </strong>
    ),
    em: ({ children, className: cn }) => (
      <em className={mergeClass("italic text-zinc-700 dark:text-zinc-300", cn)}>
        {children}
      </em>
    ),
    a: ({ href, children, className: cn }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={mergeClass(
          "font-medium text-emerald-700 underline decoration-emerald-600/40 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-700/60 dark:text-emerald-400 dark:hover:text-emerald-300",
          cn,
        )}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, className: cn }) => (
      <blockquote
        className={mergeClass(
          "my-3 border-l-4 border-emerald-500/50 bg-zinc-50 py-2 pl-3 pr-2 text-zinc-700 dark:border-emerald-400/40 dark:bg-zinc-950/50 dark:text-zinc-300",
          cn,
        )}
      >
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className?.includes("language-"));
      const text = String(children).replace(/\n$/, "");
      if (!isBlock && !text.includes("\n")) {
        return (
          <code
            className="rounded-md bg-zinc-200/90 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-900 dark:bg-zinc-700/90 dark:text-emerald-200"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className={mergeClass(
            "block font-mono text-[0.8rem] leading-relaxed text-zinc-800 dark:text-zinc-200",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }: { children?: ReactNode }) => (
      <pre className="my-3 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/80">
        {children}
      </pre>
    ),
    table: ({ children, className: cn }) => (
      <div className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className={mergeClass("w-full min-w-[240px] text-left text-xs", cn)}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, className: cn }) => (
      <thead className={mergeClass("bg-zinc-100 dark:bg-zinc-800/80", cn)}>
        {children}
      </thead>
    ),
    th: ({ children, className: cn }) => (
      <th
        className={mergeClass(
          "border-b border-zinc-200 px-3 py-2 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100",
          cn,
        )}
      >
        {children}
      </th>
    ),
    td: ({ children, className: cn }) => (
      <td
        className={mergeClass(
          "border-b border-zinc-100 px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300",
          cn,
        )}
      >
        {children}
      </td>
    ),
    tr: ({ children }) => <tr>{children}</tr>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
  };

  return (
    <div className={mergeClass(proseBase, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
