
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface StatusLogProps {
  items: {
    title: string;
    description: string;
    pubDate: string;
  }[];
  lastBuildDate?: string | null;
}

const StatusLog = ({ items, lastBuildDate }: StatusLogProps) => {
  const feedUpdateTime = lastBuildDate ? new Date(lastBuildDate) : null;

  const getStatusBackground = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('outage')) {
      return 'bg-[#FFDEE2]';
    }
    if (lowerTitle.includes('issue')) {
      return 'bg-[#FEF7CD]';
    }
    if (lowerTitle.includes('operational') || lowerTitle.includes('recovery')) {
      return 'bg-[#F2FCE2]';
    }
    return 'bg-white';
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Recent Status Updates</h2>
        {feedUpdateTime && (
          <p className="text-sm text-gray-500 mt-1">
            Last RSS Update: {format(feedUpdateTime, "MMM d, yyyy HH:mm:ss")}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`border-b border-gray-200 last:border-0 pb-4 last:pb-0 rounded-lg ${getStatusBackground(item.title)} p-4`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <span className="text-sm text-gray-500">
                {format(new Date(item.pubDate), "MMM d, yyyy HH:mm")}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StatusLog;

