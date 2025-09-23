
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopTagsListProps {
  data: { name: string; count: number }[];
}

export function TopTagsList({ data }: TopTagsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {data.map((tag) => (
            <li key={tag.name} className="flex justify-between items-center">
              <span className="text-sm font-medium">#{tag.name}</span>
              <span className="text-sm text-muted-foreground">{tag.count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
