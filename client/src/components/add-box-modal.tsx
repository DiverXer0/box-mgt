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
import { insertBoxSchema, type InsertBox, type Box } from "@shared/schema";

interface AddBoxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBox?: Box;
}

export default function AddBoxModal({ open, onOpenChange, editingBox }: AddBoxModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InsertBox>({
    resolver: zodResolver(insertBoxSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editingBox) {
      form.reset({
        name: editingBox.name,
        location: editingBox.location,
        description: editingBox.description,
      });
    } else {
      form.reset({
        name: "",
        location: "",
        description: "",
      });
    }
  }, [editingBox, form, open]);

  const createBoxMutation = useMutation({
    mutationFn: async (data: InsertBox) => {
      if (editingBox) {
        return await apiRequest("PUT", `/api/boxes/${editingBox.id}`, data);
      } else {
        return await apiRequest("POST", "/api/boxes", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: editingBox ? "Box updated" : "Box created",
        description: editingBox 
          ? "Your box has been updated successfully."
          : "Your new storage box has been created.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingBox 
          ? "Failed to update box. Please try again."
          : "Failed to create box. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBox) => {
    createBoxMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {editingBox ? "Edit Box" : "Create New Box"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Box Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter box name"
                      {...field}
                      data-testid="input-box-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Where is this box stored?"
                      {...field}
                      data-testid="input-box-location"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what's in this box"
                      rows={3}
                      {...field}
                      data-testid="textarea-box-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBoxMutation.isPending}
                data-testid="button-submit"
              >
                {createBoxMutation.isPending 
                  ? (editingBox ? "Updating..." : "Creating...")
                  : (editingBox ? "Update Box" : "Create Box")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
