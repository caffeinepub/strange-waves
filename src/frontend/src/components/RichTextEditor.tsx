import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Link,
  List,
  Minus,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "toggle"
  | "divider"
  | "table"
  | "link"
  | "bullet";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  size?: "sm" | "base" | "lg" | "xl";
  isOpen?: boolean;
  children?: Block[];
  tableData?: string[][];
  url?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function parseValue(value: string): Block[] {
  if (!value || !value.trim()) {
    return [{ id: generateId(), type: "paragraph", content: "" }];
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [{ id: generateId(), type: "paragraph", content: "" }];
  } catch {
    return [{ id: generateId(), type: "paragraph", content: value }];
  }
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const BLOCK_TYPE_OPTIONS: {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "paragraph",
    label: "Text",
    icon: <AlignLeft className="h-3.5 w-3.5" />,
  },
  {
    type: "heading1",
    label: "Heading 1",
    icon: <Heading1 className="h-3.5 w-3.5" />,
  },
  {
    type: "heading2",
    label: "Heading 2",
    icon: <Heading2 className="h-3.5 w-3.5" />,
  },
  {
    type: "heading3",
    label: "Heading 3",
    icon: <Heading3 className="h-3.5 w-3.5" />,
  },
  {
    type: "bullet",
    label: "Bullet List",
    icon: <List className="h-3.5 w-3.5" />,
  },
  {
    type: "toggle",
    label: "Toggle",
    icon: <ChevronRight className="h-3.5 w-3.5" />,
  },
  {
    type: "divider",
    label: "Divider",
    icon: <Minus className="h-3.5 w-3.5" />,
  },
  { type: "table", label: "Table", icon: <Table2 className="h-3.5 w-3.5" /> },
  { type: "link", label: "Link", icon: <Link className="h-3.5 w-3.5" /> },
];

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref is stable
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 ${className}`}
      style={{ minHeight: "1.5rem" }}
    />
  );
}

interface BlockEditorProps {
  block: Block;
  onUpdate: (updated: Block) => void;
  onDelete: () => void;
  disabled?: boolean;
}

function BlockEditor({
  block,
  onUpdate,
  onDelete,
  disabled,
}: BlockEditorProps) {
  const [hovered, setHovered] = useState(false);

  const update = useCallback(
    (partial: Partial<Block>) => onUpdate({ ...block, ...partial }),
    [block, onUpdate],
  );

  const sizeClasses: Record<string, string> = {
    sm: "text-xs",
    base: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const renderInner = () => {
    switch (block.type) {
      case "paragraph":
        return (
          <div className="flex items-start gap-2 w-full">
            <AutoResizeTextarea
              value={block.content}
              onChange={(v) => update({ content: v })}
              placeholder="Write something..."
              className={sizeClasses[block.size ?? "base"] ?? "text-sm"}
              disabled={disabled}
            />
            <div className="flex gap-1 shrink-0 mt-0.5">
              {(["sm", "base", "lg", "xl"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update({ size: s })}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    (block.size ?? "base") === s
                      ? "border-primary/60 text-primary bg-primary/10"
                      : "border-border/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s === "sm"
                    ? "S"
                    : s === "base"
                      ? "M"
                      : s === "lg"
                        ? "L"
                        : "XL"}
                </button>
              ))}
            </div>
          </div>
        );

      case "heading1":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Heading 1"
            disabled={disabled}
            className="w-full bg-transparent outline-none text-2xl font-bold text-foreground placeholder:text-muted-foreground/40"
          />
        );

      case "heading2":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Heading 2"
            disabled={disabled}
            className="w-full bg-transparent outline-none text-xl font-semibold text-foreground placeholder:text-muted-foreground/40"
          />
        );

      case "heading3":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Heading 3"
            disabled={disabled}
            className="w-full bg-transparent outline-none text-lg font-medium text-foreground placeholder:text-muted-foreground/40"
          />
        );

      case "bullet":
        return (
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground/50 mb-1">
              One item per line
            </p>
            <AutoResizeTextarea
              value={block.content}
              onChange={(v) => update({ content: v })}
              placeholder="- Item one\n- Item two"
              className="text-sm"
              disabled={disabled}
            />
          </div>
        );

      case "toggle": {
        const isOpen = block.isOpen ?? false;
        const childContent = block.children?.[0]?.content ?? "";
        return (
          <div className="w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ isOpen: !isOpen })}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <input
                type="text"
                value={block.content}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="Toggle header..."
                disabled={disabled}
                className="flex-1 bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            {isOpen && (
              <div className="ml-6 mt-2 pl-3 border-l border-border/40">
                <AutoResizeTextarea
                  value={childContent}
                  onChange={(v) =>
                    update({
                      children: [
                        { id: generateId(), type: "paragraph", content: v },
                      ],
                    })
                  }
                  placeholder="Toggle content..."
                  className="text-sm text-muted-foreground"
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        );
      }

      case "divider":
        return (
          <div className="w-full flex items-center gap-2">
            <hr className="flex-1 border-border/50" />
            <span className="text-[10px] text-muted-foreground/40">
              divider
            </span>
            <hr className="flex-1 border-border/50" />
          </div>
        );

      case "table": {
        const data = block.tableData ?? [
          ["Header 1", "Header 2"],
          ["", ""],
        ];
        const addRow = () => {
          const newRow = data[0].map(() => "");
          update({ tableData: [...data, newRow] });
        };
        const removeRow = (ri: number) => {
          if (data.length <= 1) return;
          update({ tableData: data.filter((_, i) => i !== ri) });
        };
        const addCol = () => {
          update({ tableData: data.map((row) => [...row, ""]) });
        };
        const removeCol = () => {
          if ((data[0]?.length ?? 0) <= 1) return;
          update({ tableData: data.map((row) => row.slice(0, -1)) });
        };
        const updateCell = (ri: number, ci: number, val: string) => {
          const next = data.map((row, r) =>
            row.map((cell, c) => (r === ri && c === ci ? val : cell)),
          );
          update({ tableData: next });
        };
        return (
          <div className="w-full space-y-2">
            <div className="overflow-x-auto rounded border border-border/40">
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {data.map((row, ri) => {
                    const trKey = `r-${ri}-${row.join("")}`;
                    return (
                      <tr
                        key={trKey}
                        className={
                          ri === 0 ? "bg-muted/40" : "hover:bg-muted/20"
                        }
                      >
                        {row.map((cell, ci) => {
                          const tdKey = `c-${ri}-${ci}-${cell}`;
                          return (
                            <td
                              key={tdKey}
                              className="border border-border/30 p-1"
                            >
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) =>
                                  updateCell(ri, ci, e.target.value)
                                }
                                disabled={disabled}
                                className={`w-full min-w-[60px] bg-transparent outline-none text-foreground ${
                                  ri === 0 ? "font-semibold" : ""
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="border border-border/30 p-1 w-6">
                          <button
                            type="button"
                            onClick={() => removeRow(ri)}
                            className="text-muted-foreground/40 hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addRow}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                + row
              </button>
              <button
                type="button"
                onClick={addCol}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                + col
              </button>
              <button
                type="button"
                onClick={removeCol}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
              >
                − col
              </button>
            </div>
          </div>
        );
      }

      case "link":
        return (
          <div className="w-full flex flex-col gap-1.5">
            <input
              type="text"
              value={block.content}
              onChange={(e) => update({ content: e.target.value })}
              placeholder="Link display text"
              disabled={disabled}
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40 border-b border-border/30 pb-1"
            />
            <input
              type="url"
              value={block.url ?? ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://..."
              disabled={disabled}
              className="w-full bg-transparent outline-none text-xs text-primary/70 placeholder:text-muted-foreground/30 border-b border-border/20 pb-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="group relative flex items-start gap-1.5 px-1 py-1.5 rounded-md hover:bg-muted/20 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <div
        className={`shrink-0 mt-1 transition-opacity cursor-grab ${
          hovered ? "opacity-40" : "opacity-0"
        }`}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">{renderInner()}</div>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className={`shrink-0 mt-1 transition-opacity hover:text-destructive text-muted-foreground/40 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  disabled,
}: RichTextEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseValue(value));

  // Sync external value changes (initial only)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setBlocks(parseValue(value));
    }
  }, [value]);

  const emit = useCallback(
    (next: Block[]) => {
      setBlocks(next);
      onChange(JSON.stringify(next));
    },
    [onChange],
  );

  const updateBlock = useCallback(
    (id: string, updated: Block) => {
      emit(blocks.map((b) => (b.id === id ? updated : b)));
    },
    [blocks, emit],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      const next = blocks.filter((b) => b.id !== id);
      emit(
        next.length > 0
          ? next
          : [{ id: generateId(), type: "paragraph", content: "" }],
      );
    },
    [blocks, emit],
  );

  const addBlock = useCallback(
    (type: BlockType) => {
      const newBlock: Block = {
        id: generateId(),
        type,
        content: "",
        ...(type === "table"
          ? {
              tableData: [
                ["Header 1", "Header 2"],
                ["", ""],
              ],
            }
          : {}),
        ...(type === "toggle" ? { isOpen: true, children: [] } : {}),
        ...(type === "paragraph" ? { size: "base" } : {}),
      };
      emit([...blocks, newBlock]);
    },
    [blocks, emit],
  );

  return (
    <div
      className="w-full rounded-lg border border-border/50 bg-muted/10 overflow-hidden"
      data-ocid="nft.editor"
    >
      {/* Blocks */}
      <div className="p-2 space-y-0.5 min-h-[80px]">
        {blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
            onUpdate={(updated) => updateBlock(block.id, updated)}
            onDelete={() => deleteBlock(block.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Add block toolbar */}
      <div className="px-3 py-2 border-t border-border/30 bg-muted/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add block
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {BLOCK_TYPE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.type}
                onClick={() => addBlock(opt.type)}
                className="gap-2 text-xs cursor-pointer"
              >
                {opt.icon}
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
