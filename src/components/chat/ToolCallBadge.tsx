"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function getFileName(path: string): string {
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] || path;
}

export function getToolCallLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation as { toolName: string; args?: any };
  const isDone = toolInvocation.state === "result" && !!(toolInvocation as any).result;
  const path = args?.path ? getFileName(args.path) : undefined;

  if (toolName === "str_replace_editor") {
    const action: Record<string, [string, string]> = {
      create: ["Creating", "Created"],
      str_replace: ["Editing", "Edited"],
      insert: ["Editing", "Edited"],
      view: ["Reading", "Read"],
      undo_edit: ["Reverting", "Reverted"],
    };
    const [inProgress, done] = action[args?.command] || ["Updating", "Updated"];
    const verb = isDone ? done : inProgress;
    return path ? `${verb} ${path}` : `${verb} file`;
  }

  if (toolName === "file_manager") {
    if (args?.command === "rename") {
      const verb = isDone ? "Renamed" : "Renaming";
      const newPath = args?.new_path ? getFileName(args.new_path) : undefined;
      if (path && newPath) return `${verb} ${path} to ${newPath}`;
      return path ? `${verb} ${path}` : `${verb} file`;
    }
    if (args?.command === "delete") {
      const verb = isDone ? "Deleted" : "Deleting";
      return path ? `${verb} ${path}` : `${verb} file`;
    }
    return path ? `Updating ${path}` : "Updating file";
  }

  return toolName.replace(/_/g, " ");
}

export function ToolCallBadge({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const isDone =
    toolInvocation.state === "result" && !!(toolInvocation as any).result;
  const label = getToolCallLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-violet-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
