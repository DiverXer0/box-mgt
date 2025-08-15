import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Activity, Box, Package, MapPin, Settings, Download, Upload } from "lucide-react";
import type { ActivityLog } from "@shared/schema";

const actionIcons = {
  create: Package,
  update: Settings,
  delete: Box,
  backup: Download,
  restore: Upload,
};

const actionColors = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800", 
  delete: "bg-red-100 text-red-800",
  backup: "bg-purple-100 text-purple-800",
  restore: "bg-orange-100 text-orange-800",
};

const entityTypeIcons = {
  box: Box,
  item: Package,
  location: MapPin,
  system: Settings,
};

export default function ActivityLog() {
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>Recent system activity and changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Recent system activity and changes. Showing last 50 activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activity will appear here as you use the system.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {logs.map((log) => {
                const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || Activity;
                const EntityIcon = entityTypeIcons[log.entityType as keyof typeof entityTypeIcons] || Package;
                const actionColor = actionColors[log.action as keyof typeof actionColors] || "bg-gray-100 text-gray-800";
                
                let description = "";
                switch (log.action) {
                  case "create":
                    description = `Created ${log.entityType} "${log.entityName}"`;
                    break;
                  case "update":
                    description = `Updated ${log.entityType} "${log.entityName}"`;
                    break;
                  case "delete":
                    description = `Deleted ${log.entityType} "${log.entityName}"`;
                    break;
                  case "backup":
                    description = "Created system backup";
                    break;
                  case "restore":
                    description = "Restored system from backup";
                    break;
                  default:
                    description = `${log.action} ${log.entityType} "${log.entityName}"`;
                }

                return (
                  <div 
                    key={log.id} 
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`activity-log-${log.id}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <EntityIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border">
                          <ActionIcon className="h-2.5 w-2.5 text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900" data-testid={`activity-description-${log.id}`}>
                        {description}
                      </p>
                      <p className="text-xs text-gray-500" data-testid={`activity-time-${log.id}`}>
                        {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "Unknown time"}
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-400 mt-1" data-testid={`activity-details-${log.id}`}>
                          {log.details}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-xs ${actionColor}`} data-testid={`activity-badge-${log.id}`}>
                      {log.action}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}