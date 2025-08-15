import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Package, DollarSign, QrCode, MoreVertical, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import QRCodeModal from "@/components/qr-code-modal";
import AddBoxModal from "@/components/add-box-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type BoxWithStats } from "@shared/schema";

interface BoxCardProps {
  box: BoxWithStats;
}

export default function BoxCard({ box }: BoxCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const deleteBoxMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/boxes/${box.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Box deleted",
        description: "The box and all its items have been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete box. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = () => {
    setLocation(`/box/${box.id}`);
  };

  const handleDelete = () => {
    deleteBoxMutation.mutate();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Updated today";
    if (diffDays === 2) return "Updated yesterday";
    if (diffDays <= 7) return `Updated ${diffDays - 1} days ago`;
    if (diffDays <= 30) return `Updated ${Math.ceil(diffDays / 7)} weeks ago`;
    return `Updated ${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 group" data-testid={`card-box-${box.id}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" onClick={handleViewDetails}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-primary transition-colors" data-testid={`text-box-name-${box.id}`}>
                {box.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 flex items-center" data-testid={`text-box-location-${box.id}`}>
                <MapPin className="h-3 w-3 mr-1" />
                {box.location}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQRCodeOpen(true);
                }}
                data-testid={`button-qr-${box.id}`}
              >
                <QrCode className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`button-menu-${box.id}`}
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditOpen(true);
                    }}
                    data-testid={`button-edit-${box.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        data-testid={`button-delete-${box.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                        <span className="text-red-600">Delete</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Box</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{box.name}"? This will also delete all {box.itemCount} items in this box. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          data-testid={`button-confirm-delete-${box.id}`}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2" onClick={handleViewDetails} data-testid={`text-box-description-${box.id}`}>
            {box.description}
          </p>
          
          <div className="flex justify-between items-center text-sm mb-4" onClick={handleViewDetails}>
            <div className="flex items-center space-x-4">
              <span className="text-gray-500 dark:text-gray-400 flex items-center">
                <Package className="h-3 w-3 mr-1" />
                <span data-testid={`text-item-count-${box.id}`}>{box.itemCount} items</span>
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                <span data-testid={`text-total-value-${box.id}`}>${box.totalValue.toFixed(2)}</span>
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-500 text-xs" data-testid={`text-last-updated-${box.id}`}>
              {formatDate(box.createdAt || undefined)}
            </span>
          </div>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-1">
                {/* Item type indicators */}
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <Package className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <Package className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewDetails}
                className="text-primary hover:text-primary text-xs font-medium"
                data-testid={`button-view-details-${box.id}`}
              >
                View Details →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeModal
        open={isQRCodeOpen}
        onOpenChange={setIsQRCodeOpen}
        mode="display"
        boxId={box.id}
        boxName={box.name}
      />
      
      <AddBoxModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        editingBox={box}
      />
    </>
  );
}
