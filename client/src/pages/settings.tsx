import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, AlertTriangle, Settings as SettingsIcon, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/app-header";
import LocationModal from "@/components/location-modal";
import { apiRequest } from "@/lib/queryClient";
import { type Location } from "@shared/schema";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location. It may be in use by existing boxes.",
        variant: "destructive",
      });
    },
  });

  const handleFullBackup = async () => {
    try {
      setIsBackingUp(true);
      
      const response = await fetch('/api/backup/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backup failed: ${response.statusText}`);
      }

      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      a.download = `box-management-backup-${timestamp}.zip`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup Complete",
        description: "Your data has been successfully backed up and downloaded.",
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred during backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid backup file (.zip)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRestoring(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('backup', file);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          toast({
            title: "Restore Complete",
            description: response.message || "Your data has been successfully restored. The page will reload.",
          });
          // Reload the page to show restored data
          setTimeout(() => {
            window.location.href = '/';  // Go back to dashboard
            setTimeout(() => window.location.reload(), 100);
          }, 2000);
        } else {
          throw new Error(`Restore failed: ${xhr.statusText}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Network error during restore');
      });

      xhr.open('POST', '/api/restore/full');
      xhr.send(formData);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred during restore.",
        variant: "destructive",
      });
      setIsRestoring(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader 
        pageTitle="Settings"
        showSearch={false}
        showBackButton={true}
        backButtonText="Dashboard"
        onBackClick={() => setLocation('/')}
      />
      
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
        {/* Backup & Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup & Restore
            </CardTitle>
            <CardDescription>
              Manage your data with full system backup and restore capabilities.
              Backups include all boxes, items, and receipt files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full System Backup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Full System Backup</h3>
                <p className="text-sm text-muted-foreground">
                  Download a complete backup of all your data including receipts
                </p>
              </div>
              <Button 
                onClick={handleFullBackup} 
                disabled={isBackingUp}
                data-testid="button-full-backup"
              >
                <Download className="h-4 w-4 mr-2" />
                {isBackingUp ? "Creating Backup..." : "Download Backup"}
              </Button>
            </div>

            <Separator />

            {/* Full System Restore */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium">Full System Restore</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload and restore a complete backup (overwrites all existing data)
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={isRestoring}
                      data-testid="button-restore-trigger"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isRestoring ? "Restoring..." : "Restore Backup"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Confirm Data Restore
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will completely replace all your current data with the backup file.
                        All existing boxes, items, and receipts will be permanently overwritten.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-restore-cancel">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.zip';
                          input.onchange = (e) => handleRestoreUpload(e as any);
                          input.click();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-restore-confirm"
                      >
                        Yes, Overwrite All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Progress indicator during restore */}
              {isRestoring && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Restoring data...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Information about your Box Management System installation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Version:</span>
                <span className="ml-2">1.0.0</span>
              </div>
              <div>
                <span className="font-medium">Database:</span>
                <span className="ml-2">SQLite</span>
              </div>
              <div>
                <span className="font-medium">Storage:</span>
                <span className="ml-2">Local File System</span>
              </div>
              <div>
                <span className="font-medium">Backup Format:</span>
                <span className="ml-2">ZIP Archive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Management</span>
            </CardTitle>
            <CardDescription>
              Manage storage locations for organizing your boxes. Locations help you keep track of where your physical boxes are stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Storage Locations</span>
              <Button
                onClick={() => {
                  setEditingLocation(undefined);
                  setIsLocationModalOpen(true);
                }}
                size="sm"
                data-testid="button-add-location"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            {locationsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-md animate-pulse" />
                ))}
              </div>
            ) : locations && locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    data-testid={`location-item-${location.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900" data-testid={`text-location-name-${location.id}`}>
                        {location.name}
                      </h4>
                      {location.description && (
                        <p className="text-sm text-gray-600" data-testid={`text-location-description-${location.id}`}>
                          {location.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingLocation(location);
                          setIsLocationModalOpen(true);
                        }}
                        data-testid={`button-edit-location-${location.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-delete-location-${location.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Location</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{location.name}"? This action cannot be undone.
                              Note: You cannot delete locations that are currently being used by boxes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLocationMutation.mutate(location.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No locations yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first storage location to better organize your boxes.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      setEditingLocation(undefined);
                      setIsLocationModalOpen(true);
                    }}
                    size="sm"
                    data-testid="button-add-first-location"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first location
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </main>

      <LocationModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        editingLocation={editingLocation}
      />
    </div>
  );
}