import { useEffect } from "react";
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
import { insertLocationSchema, type InsertLocation, type Location } from "@shared/schema";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation?: Location;
}

export default function LocationModal({ open, onOpenChange, editingLocation }: LocationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InsertLocation>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editingLocation) {
      form.reset({
        name: editingLocation.name,
        description: editingLocation.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [editingLocation, form, open]);

  const createLocationMutation = useMutation({
    mutationFn: async (data: InsertLocation) => {
      if (editingLocation) {
        return await apiRequest("PUT", `/api/locations/${editingLocation.id}`, data);
      } else {
        return await apiRequest("POST", "/api/locations", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Success",
        description: editingLocation ? "Location updated successfully" : "Location created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Location mutation error:", error);
      toast({
        title: "Error",
        description: error.message || (editingLocation ? "Failed to update location" : "Failed to create location"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLocation) => {
    createLocationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="modal-location">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {editingLocation ? "Edit Location" : "Add New Location"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Basement Shelf A-1" 
                      {...field} 
                      data-testid="input-location-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this storage location..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-location-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-location"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLocationMutation.isPending}
                data-testid="button-save-location"
              >
                {createLocationMutation.isPending 
                  ? "Saving..." 
                  : (editingLocation ? "Update Location" : "Add Location")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}