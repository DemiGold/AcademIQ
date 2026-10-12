interface ActivityListItem {
  primary: string;
  secondary: string;
  timestamp: string;
  accent?: "success" | "brand";
}

interface ActivityListProps {
  items: ActivityListItem[];
  emptyText: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityList({ items, emptyText }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-text-muted py-8 text-center">{emptyText}</div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div
            className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
              item.accent === "brand" ? "bg-brand-primary" : "bg-brand-success"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary font-medium truncate">
              {item.primary}
            </p>
            <p className="text-xs text-text-muted truncate">{item.secondary}</p>
          </div>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {timeAgo(item.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}