import { useState } from "react";
import type { Block } from "./RichTextEditor";

function parseBlocks(value: string): Block[] | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as Block[];
    return null;
  } catch {
    return null;
  }
}

function ToggleBlock({ block }: { block: Block }) {
  const [open, setOpen] = useState(block.isOpen ?? false);
  const childContent = block.children?.[0]?.content ?? "";
  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-left w-full font-medium text-foreground hover:text-primary transition-colors"
      >
        <span className="text-muted-foreground text-xs">
          {open ? "▼" : "▶"}
        </span>
        {block.content || (
          <span className="text-muted-foreground/50 italic">Toggle</span>
        )}
      </button>
      {open && childContent && (
        <div className="ml-5 mt-1.5 pl-3 border-l border-border/40 text-sm text-foreground/80">
          {childContent}
        </div>
      )}
    </div>
  );
}

function renderBlock(block: Block, index: number): React.ReactNode {
  const sizeClasses: Record<string, string> = {
    sm: "text-xs",
    base: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  switch (block.type) {
    case "paragraph": {
      const sz = sizeClasses[block.size ?? "base"] ?? "text-sm";
      if (!block.content) return null;
      return (
        <p key={index} className={`${sz} leading-relaxed text-foreground/85`}>
          {block.content}
        </p>
      );
    }

    case "heading1":
      if (!block.content) return null;
      return (
        <h1
          key={index}
          className="text-2xl font-bold text-foreground mt-4 mb-1"
        >
          {block.content}
        </h1>
      );

    case "heading2":
      if (!block.content) return null;
      return (
        <h2
          key={index}
          className="text-xl font-semibold text-foreground mt-3 mb-1"
        >
          {block.content}
        </h2>
      );

    case "heading3":
      if (!block.content) return null;
      return (
        <h3
          key={index}
          className="text-base font-medium text-foreground mt-2 mb-0.5"
        >
          {block.content}
        </h3>
      );

    case "bullet": {
      if (!block.content) return null;
      const items = block.content.split("\n").filter((l) => l.trim());
      return (
        <ul
          key={index}
          className="list-disc list-inside space-y-1 text-sm text-foreground/85"
        >
          {items.map((item) => {
            const liKey = `li-${item}`;
            return <li key={liKey}>{item.replace(/^[-*]\s*/, "")}</li>;
          })}
        </ul>
      );
    }

    case "toggle":
      return <ToggleBlock key={index} block={block} />;

    case "divider":
      return <hr key={index} className="border-border/30 my-3" />;

    case "table": {
      const data = block.tableData;
      if (!data || data.length === 0) return null;
      return (
        <div
          key={index}
          className="overflow-x-auto my-2 rounded border border-border/40"
        >
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {data[0].map((cell, ci) => {
                  const thKey = `th-${ci}`;
                  return (
                    <th
                      key={thKey}
                      className="border border-border/30 px-3 py-2 text-left font-semibold text-foreground"
                    >
                      {cell}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, ri) => {
                const rowKey = `tr-${ri}`;
                return (
                  <tr
                    key={rowKey}
                    className={ri % 2 === 0 ? "" : "bg-muted/20"}
                  >
                    {row.map((cell, ci) => {
                      const cellKey = `td-${ri}-${ci}`;
                      return (
                        <td
                          key={cellKey}
                          className="border border-border/30 px-3 py-2 text-foreground/80"
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    case "link":
      if (!block.url && !block.content) return null;
      return (
        <a
          key={index}
          href={block.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          {block.content || block.url}
        </a>
      );

    default:
      return null;
  }
}

interface RichTextRendererProps {
  value: string;
  className?: string;
}

export function RichTextRenderer({
  value,
  className = "",
}: RichTextRendererProps) {
  const blocks = parseBlocks(value);

  if (!blocks) {
    // Plain text fallback
    return (
      <p className={`text-sm leading-relaxed text-foreground/85 ${className}`}>
        {value}
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
