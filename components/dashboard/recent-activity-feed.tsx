
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentActivityFeedProps {
  data: {
    type: string;
    user: string;
    item: string;
    timestamp: string;
  }[];
}

function formatActivity(activity: RecentActivityFeedProps['data'][0]) {
  switch (activity.type) {
    case 'knowledge_created':
      return <p><span className="font-semibold">{activity.user}</span> criou o item: <span className="italic">{activity.item}</span></p>;
    case 'knowledge_viewed':
      return <p><span className="font-semibold">{activity.user}</span> visualizou: <span className="italic">{activity.item}</span></p>;
    case 'knowledge_bookmarked':
      return <p><span className="font-semibold">{activity.user}</span> favoritou: <span className="italic">{activity.item}</span></p>;
    default:
      return <p>{activity.item}</p>;
  }
}

export function RecentActivityFeed({ data }: RecentActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {data.map((activity, index) => (
            <li key={index} className="flex items-start space-x-4">
              <div className="text-sm">
                {formatActivity(activity)}
                <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
