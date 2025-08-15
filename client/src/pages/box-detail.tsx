import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Plus, FileText, Download, QrCode, Edit, Trash2, MapPin, Receipt, DollarSign, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AppHeader from "@/components/app-header";
import AddItemModal from "@/components/add-item-modal";
import QRCodeModal from "@/components/qr-code-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportBoxToPDF, exportBoxToCSV } from "@/lib/export-utils";
import { type BoxWithItems, type Item } from "@shared/schema";

export default function BoxDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { data: box, isLoading } = useQuery<BoxWithItems>({
    queryKey: ["/api/boxes", id],
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Item deleted",
        description: "The item has been removed from your box.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportPDF = async () => {
    if (!box) return;
    try {
      await exportBoxToPDF(box);
      toast({
        title: "PDF exported",
        description: "Box contents have been exported to PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!box) return;
    try {
      exportBoxToCSV(box);
      toast({
        title: "CSV exported",
        description: "Box contents have been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItemMutation.mutate(itemId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Box not found</h1>
          <p className="text-gray-600 mb-4">The box you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader 
        pageTitle={box.name}
        showSearch={false}
        showBackButton={true}
        backButtonText="Dashboard"
        onBackClick={() => setLocation('/')}
      >
        {/* Export Actions in Header */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          data-testid="button-export-pdf"
          className="hidden sm:flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>PDF</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          data-testid="button-export-csv"
          className="hidden sm:flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsQRCodeOpen(true)}
          data-testid="button-show-qr"
          className="flex items-center space-x-2"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">QR</span>
        </Button>
        <Button
          onClick={() => setIsAddItemOpen(true)}
          size="sm"
          data-testid="button-add-item"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </AppHeader>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Box Info Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 flex items-center mt-1" data-testid="text-box-location">
                  <MapPin className="h-4 w-4 mr-1" />
                  {box.location}
                </p>
                {box.description && (
                  <p className="mt-2 text-gray-700">{box.description}</p>
                )}
              </div>
            </div>
            
            {/* Box Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-2xl font-semibold text-gray-900" data-testid="text-item-count">
                    {box.itemCount}
                  </p>
                  <p className="text-sm text-gray-500">Items</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-semibold text-green-600" data-testid="text-total-value">
                    ${box.totalValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Total Value</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Receipt className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-semibold text-blue-600" data-testid="text-receipts-count">
                    {box.withReceipts}
                  </p>
                  <p className="text-sm text-gray-500">With Receipts</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Items List */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Items in this box</h2>
              <p className="text-gray-600">{box.description}</p>
            </div>

            {box.items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first item to this box to get started.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsAddItemOpen(true)} data-testid="button-add-first-item">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first item
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
            {box.items.map((item, index) => (
              <Card 
                key={item.id} 
                className="hover-lift animate-fade-in border-gray-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900" data-testid={`text-item-name-${item.id}`}>
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600" data-testid={`text-item-details-${item.id}`}>
                            {item.details}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <span className="text-gray-600">
                          <Package className="h-4 w-4 inline mr-1" />
                          Qty: <span className="font-medium" data-testid={`text-item-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                        </span>
                        {item.value && (
                          <span className="text-green-600 font-medium">
                            <DollarSign className="h-4 w-4 inline mr-1" />
                            <span data-testid={`text-item-value-${item.id}`}>
                              ${(item.value * item.quantity).toFixed(2)}
                            </span>
                          </span>
                        )}
                        <span className={item.receiptFilename ? "text-blue-600" : "text-gray-400"}>
                          <Receipt className="h-4 w-4 inline mr-1" />
                          <span data-testid={`text-item-receipt-${item.id}`}>
                            {item.receiptFilename ? "Receipt Available" : "No Receipt"}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.receiptFilename && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/api/items/${item.id}/receipt`, '_blank')}
                          data-testid={`button-view-receipt-${item.id}`}
                          title="View Receipt"
                        >
                          <Receipt className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingItem(item)}
                        data-testid={`button-edit-item-${item.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(item.id)}
                              data-testid={`button-confirm-delete-${item.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddItemModal
        open={isAddItemOpen || !!editingItem}
        onOpenChange={(open) => {
          setIsAddItemOpen(open);
          if (!open) setEditingItem(null);
        }}
        boxId={box.id}
        editingItem={editingItem}
      />
      <QRCodeModal
        open={isQRCodeOpen}
        onOpenChange={setIsQRCodeOpen}
        mode="display"
        boxId={box.id}
        boxName={box.name}
      />
    </div>
  );
}
