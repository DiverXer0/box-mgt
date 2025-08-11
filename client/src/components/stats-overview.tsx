import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Boxes, Package, DollarSign, Receipt } from "lucide-react";

interface Stats {
  totalBoxes: number;
  totalItems: number;
  totalValue: number;
  itemsWithReceipts: number;
}

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      label: "Total Boxes",
      value: stats.totalBoxes,
      icon: Boxes,
      color: "text-primary",
      testId: "stat-total-boxes"
    },
    {
      label: "Total Items", 
      value: stats.totalItems,
      icon: Package,
      color: "text-green-600",
      testId: "stat-total-items"
    },
    {
      label: "Total Value",
      value: `$${stats.totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-blue-600",
      testId: "stat-total-value"
    },
    {
      label: "With Receipts",
      value: stats.itemsWithReceipts,
      icon: Receipt,
      color: "text-orange-600",
      testId: "stat-receipts"
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statItems.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900" data-testid={stat.testId}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
