import type { TagRow } from '@/types/database';

export interface TaskTagsProps {
  tags: TagRow[];
}

export function TaskTags({ tags }: TaskTagsProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: `${tag.color}1A`, color: tag.color }}
        >
          {tag.name}
        </span>
      ))}
    </>
  );
}
