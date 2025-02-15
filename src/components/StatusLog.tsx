
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface StatusLogProps {
  items: {
    title: string;
    description: string;
    pubDate: string;
  }[];
}

const StatusLog = ({ items }: StatusLogProps) => {
  const lastUpdate = items.length > 0 ? new Date(items[0].pubDate) : null;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Recent Status Updates</h2>
        {lastUpdate && (
          <p className="text-sm text-gray-500 mt-1">
            Last update: {format(lastUpdate, "MMM d, yyyy HH:mm")}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
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
