import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, QrCode, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsOverview from "@/components/stats-overview";
import BoxCard from "@/components/box-card";
import AddBoxModal from "@/components/add-box-modal";
import QRCodeModal from "@/components/qr-code-modal";
import { type BoxWithStats } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddBoxOpen, setIsAddBoxOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("name");

  const { data: boxes = [], isLoading } = useQuery<BoxWithStats[]>({
    queryKey: ["/api/boxes"],
  });

  const { data: searchResults } = useQuery<{ boxes: BoxWithStats[]; items: any[] }>({
    queryKey: ["/api/search", { q: searchQuery }],
    enabled: searchQuery.length > 0,
  });

  const displayBoxes = searchQuery.length > 0 ? searchResults?.boxes || [] : boxes;

  const sortedBoxes = [...displayBoxes].sort((a, b) => {
    switch (sortOrder) {
      case "location":
        return a.location.localeCompare(b.location);
      case "value":
        return b.totalValue - a.totalValue;
      case "created":
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Boxes className="text-primary text-2xl" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Box Management</h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search boxes and items..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('=== QUICK CAMERA TEST (MOBILE) ===');
                  console.log('User agent:', navigator.userAgent);
                  console.log('Is secure context:', window.isSecureContext);
                  console.log('Protocol:', location.protocol);
                  console.log('navigator.mediaDevices type:', typeof navigator.mediaDevices);
                  console.log('navigator.mediaDevices value:', navigator.mediaDevices);
                  console.log('Has getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
                  
                  // Check for the exact error from the screenshot
                  if (!navigator.mediaDevices || typeof navigator.mediaDevices !== 'object') {
                    alert('navigator.mediaDevices is undefined - need HTTPS or newer browser');
                    return;
                  }
                  
                  if (!navigator.mediaDevices.getUserMedia || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                    alert('getUserMedia function not available');
                    return;
                  }
                  
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    console.log('✓ Camera test successful!');
                    stream.getTracks().forEach(track => track.stop());
                    alert('Camera access works! Try the QR scanner now.');
                  } catch (error: any) {
                    console.error('✗ Camera test failed:', error);
                    alert(`Camera failed: ${error.name} - ${error.message}`);
                  }
                }}
                data-testid="button-camera-test"
                title="Test Camera"
                className="hidden sm:inline-flex"
              >
                📱 Test
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsQRScannerOpen(true)}
                data-testid="button-qr-scanner"
                title="Scan QR Code"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <Button
                onClick={() => setIsAddBoxOpen(true)}
                data-testid="button-add-box"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Box
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <StatsOverview />

          {/* Boxes Grid */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {searchQuery ? `Search Results (${displayBoxes.length})` : "Storage Boxes"}
              </h2>
              <div className="flex items-center space-x-3">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  data-testid="select-sort"
                >
                  <option value="name">Sort by Name</option>
                  <option value="location">Sort by Location</option>
                  <option value="value">Sort by Value</option>
                  <option value="created">Sort by Date Created</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedBoxes.length === 0 ? (
              <div className="text-center py-12">
                <Boxes className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchQuery ? "No boxes found" : "No boxes yet"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first storage box"}
                </p>
                {!searchQuery && (
                  <div className="mt-6">
                    <Button onClick={() => setIsAddBoxOpen(true)} data-testid="button-create-first-box">
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first box
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedBoxes.map((box) => (
                  <BoxCard key={box.id} box={box} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddBoxModal open={isAddBoxOpen} onOpenChange={setIsAddBoxOpen} />
      <QRCodeModal open={isQRScannerOpen} onOpenChange={setIsQRScannerOpen} mode="scanner" />
    </div>
  );
}
