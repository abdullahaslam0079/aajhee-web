"use client";

import type { CategoryTreeNode } from "@/lib/types";
import { inputClass } from "./ui";

export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0
): Array<CategoryTreeNode & { depth: number; pathLabel: string }> {
  const out: Array<CategoryTreeNode & { depth: number; pathLabel: string }> = [];
  for (const node of nodes) {
    out.push({
      ...node,
      depth,
      pathLabel: `${"— ".repeat(depth)}${node.name}`,
    });
    if (node.children?.length) {
      out.push(...flattenCategoryTree(node.children, depth + 1));
    }
  }
  return out;
}

type Props = {
  tree: CategoryTreeNode[];
  value: string | number | "";
  onChange: (value: string) => void;
  required?: boolean;
  rootsOnly?: boolean;
  preferLeaves?: boolean;
  placeholder?: string;
  className?: string;
};

export function CategoryTreePicker({
  tree,
  value,
  onChange,
  required,
  rootsOnly = false,
  preferLeaves = false,
  placeholder = "Select category",
  className,
}: Props) {
  const options = rootsOnly
    ? tree.map((n) => ({ ...n, depth: 0, pathLabel: n.name }))
    : flattenCategoryTree(tree);

  return (
    <select
      className={className || inputClass}
      value={value === "" || value == null ? "" : String(value)}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((node) => {
        return (
          <option key={node.id} value={node.id}>
            {node.pathLabel}
            {preferLeaves && node.children?.length ? " (has subcategories)" : ""}
          </option>
        );
      })}
    </select>
  );
}
