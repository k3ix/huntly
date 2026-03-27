import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  name: string;
}

export function TagBadge({ name }: TagBadgeProps) {
  return <Badge variant="secondary">{name}</Badge>;
}
