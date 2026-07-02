import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

function makeInvocation(overrides: Partial<ToolInvocation> & { toolName: string; args: any }): ToolInvocation {
  return {
    toolCallId: "call_1",
    state: "call",
    ...overrides,
  } as ToolInvocation;
}

test("shows in-progress label while creating a file", () => {
  const invocation = makeInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/Card.jsx" },
    state: "call",
  });

  expect(getToolCallLabel(invocation)).toBe("Creating Card.jsx");
});

test("shows done label once a file has been created", () => {
  const invocation = makeInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/Card.jsx" },
    state: "result",
    result: "File created: /components/Card.jsx",
  } as any);

  expect(getToolCallLabel(invocation)).toBe("Created Card.jsx");
});

test("labels str_replace and insert commands as editing", () => {
  const strReplace = makeInvocation({
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.jsx" },
  });
  const insert = makeInvocation({
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/App.jsx" },
  });

  expect(getToolCallLabel(strReplace)).toBe("Editing App.jsx");
  expect(getToolCallLabel(insert)).toBe("Editing App.jsx");
});

test("labels rename with both source and destination file names", () => {
  const invocation = makeInvocation({
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/components/Old.jsx",
      new_path: "/components/New.jsx",
    },
  });

  expect(getToolCallLabel(invocation)).toBe("Renaming Old.jsx to New.jsx");
});

test("labels delete", () => {
  const invocation = makeInvocation({
    toolName: "file_manager",
    args: { command: "delete", path: "/components/Old.jsx" },
    state: "result",
    result: { success: true },
  } as any);

  expect(getToolCallLabel(invocation)).toBe("Deleted Old.jsx");
});

test("falls back to a humanized tool name when there is no path", () => {
  const invocation = makeInvocation({
    toolName: "some_other_tool",
    args: {},
  });

  expect(getToolCallLabel(invocation)).toBe("some other tool");
});

test("renders the friendly label and a spinner while in progress", () => {
  const invocation = makeInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  });

  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("renders a completed indicator once the tool call has a result", () => {
  const invocation = makeInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "File created: /App.jsx",
  } as any);

  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);

  expect(screen.getByText("Created App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
});
