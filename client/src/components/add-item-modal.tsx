import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertItemSchema, type InsertItem, type Item } from "@shared/schema";
import { CloudUpload, X } from "lucide-react";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxId: string;
  editingItem?: Item | null;
}

export default function AddItemModal({ open, onOpenChange, boxId, editingItem }: AddItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const form = useForm<InsertItem>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      boxId,
      name: "",
      quantity: 1,
      details: "",
      value: undefined,
      receiptFilename: null,
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        boxId: editingItem.boxId,
        name: editingItem.name,
        quantity: editingItem.quantity,
        details: editingItem.details,
        value: editingItem.value || undefined,
        receiptFilename: editingItem.receiptFilename,
      });
    } else {
      form.reset({
        boxId,
        name: "",
        quantity: 1,
        details: "",
        value: undefined,
        receiptFilename: null,
      });
    }
    setSelectedFile(null);
  }, [editingItem, form, open, boxId]);

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertItem) => {
      let response;
      if (editingItem) {
        response = await apiRequest("PUT", `/api/items/${editingItem.id}`, data);
      } else {
        response = await apiRequest("POST", "/api/items", data);
      }
      
      const item = await response.json();
      
      // Upload receipt if file is selected
      if (selectedFile && item.id) {
        const formData = new FormData();
        formData.append('receipt', selectedFile);
        
        await fetch(`/api/items/${item.id}/receipt`, {
          method: 'POST',
          body: formData,
        });
      }
      
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes", boxId] });
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: editingItem ? "Item updated" : "Item added",
        description: editingItem 
          ? "Your item has been updated successfully."
          : "Your new item has been added to the box.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingItem 
          ? "Failed to update item. Please try again."
          : "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertItem) => {
    createItemMutation.mutate(data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    // Reset the file input
    const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle data-testid="text-item-modal-title">
            {editingItem ? "Edit Item" : "Add New Item"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Item name"
                        {...field}
                        data-testid="input-item-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-item-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this item"
                      rows={3}
                      {...field}
                      data-testid="textarea-item-details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ""}
                        data-testid="input-item-value"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt (Optional)
              </label>
              {selectedFile ? (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CloudUpload className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-900">{selectedFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                    id="receipt-upload"
                    onChange={handleFileSelect}
                    data-testid="input-receipt-file"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <div className="text-center">
                      <CloudUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload receipt</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG, GIF up to 10MB</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-item"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending}
                data-testid="button-submit-item"
              >
                {createItemMutation.isPending 
                  ? (editingItem ? "Updating..." : "Adding...")
                  : (editingItem ? "Update Item" : "Add Item")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
