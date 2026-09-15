import { Category } from '@/types/models';

export function flattenCategories(
  nodes: Category[],
  depth = 0,
): { value: string; label: string }[] {
  return nodes.flatMap((node) => [
    { value: node.id, label: `${'  '.repeat(depth)}${depth > 0 ? '└ ' : ''}${node.categoryName}` },
    ...flattenCategories(node.children ?? [], depth + 1),
  ]);
}
