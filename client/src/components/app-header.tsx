import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, QrCode, Boxes, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onAddBoxClick?: () => void;
  onQRScannerClick?: () => void;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  pageTitle?: string;
  showSearch?: boolean;
  children?: React.ReactNode;
}

export default function AppHeader({
  searchQuery = "",
  onSearchChange,
  onAddBoxClick,
  onQRScannerClick,
  showBackButton = false,
  backButtonText = "Back",
  onBackClick,
  pageTitle,
  showSearch = true,
  children
}: AppHeaderProps) {
  const [location, setLocation] = useLocation();
  
  const isSettingsPage = location === '/settings';
  const isDashboard = location === '/';
  
  const handleNavigateToSettings = () => {
    setLocation('/settings');
  };
  
  const handleNavigateToDashboard = () => {
    setLocation('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Logo/Title or Back Button */}
          <div className="flex items-center space-x-4">
            {showBackButton ? (
              <Button
                variant="ghost"
                onClick={onBackClick || handleNavigateToDashboard}
                className="flex items-center space-x-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backButtonText}</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                <Boxes className="text-primary text-2xl" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {pageTitle || "Box Management"}
                  </h1>
                  {!isDashboard && (
                    <nav className="text-sm text-gray-500">
                      <button 
                        onClick={handleNavigateToDashboard}
                        className="hover:text-gray-700 transition-colors"
                        data-testid="link-dashboard"
                      >
                        Dashboard
                      </button>
                      {pageTitle && (
                        <>
                          <span className="mx-2">/</span>
                          <span className="text-gray-900">{pageTitle}</span>
                        </>
                      )}
                    </nav>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Center Section - Search Bar */}
          {showSearch && (
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
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          )}
          
          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {children}
            
            {/* Show default actions only when no children provided */}
            {!children && (
              <>
                {onQRScannerClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onQRScannerClick}
                    className="flex items-center space-x-2"
                    data-testid="button-qr-scanner"
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">Scan QR</span>
                  </Button>
                )}
                
                {onAddBoxClick && (
                  <Button
                    onClick={onAddBoxClick}
                    size="sm"
                    className="flex items-center space-x-2"
                    data-testid="button-add-box"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Box</span>
                  </Button>
                )}
              </>
            )}
            
            {/* Navigation Pills */}
            <div className="hidden md:flex items-center space-x-2 ml-2">
              <Button
                variant={isDashboard ? "default" : "ghost"}
                size="sm"
                onClick={handleNavigateToDashboard}
                className="flex items-center space-x-2"
                data-testid="nav-dashboard"
              >
                <Boxes className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              
              <Button
                variant={isSettingsPage ? "default" : "ghost"}
                size="sm"
                onClick={handleNavigateToSettings}
                className="flex items-center space-x-2"
                data-testid="nav-settings"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}