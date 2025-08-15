import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, AlertTriangle, Settings as SettingsIcon, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/app-header";
import LocationManager from "@/components/location-manager";
import ActivityLog from "@/components/activity-log";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        {/* User Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              User Preferences
            </CardTitle>
            <CardDescription>
              Customize your application settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Choose between light, dark, or system theme
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Location Management Section */}
        <LocationManager />

        {/* Activity Log Section */}
        <ActivityLog />

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
          </div>
        </div>
      </main>
    </div>
  );
}