// ... keep existing code (imports and component start) ...

import { useApp } from '../components/AppProvider';

export default function SuperAdminDashboard() {
  // ... keep existing code (existing state variables) ...
  
  const { currentApp, switchToApp } = useApp();

  // ... keep existing code (useEffect, loadData, filterUsers, other functions) ...

  const handleSwitchApp = (appId) => {
    switchToApp(appId);
    setIsSwitchAppModalOpen(false);
    alert(`Switched to ${appId === 'app1' ? 'Advance Investment Platform' : 'Advance Investment Protection Platform'}`);
  };

  // ... keep existing code (main component render until Switch App Modal) ...

      {/* Switch App Modal */}
      <Dialog open={isSwitchAppModalOpen} onOpenChange={setIsSwitchAppModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-600" />
              Switch Application
            </DialogTitle>
            <DialogClose />
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 mb-6">
              Choose which application version to switch to:
            </p>
            
            <div className="grid gap-3">
              <Card 
                className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-2 ${
                  currentApp === 'app1' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'
                }`}
                onClick={() => handleSwitchApp('app1')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">App 1</h3>
                    <p className="text-sm text-gray-500">Advance Investment Platform</p>
                  </div>
                  {currentApp === 'app1' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card 
                className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-2 ${
                  currentApp === 'app2' ? 'border-green-500 bg-green-50' : 'hover:border-green-300'
                }`}
                onClick={() => handleSwitchApp('app2')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">App 2</h3>
                    <p className="text-sm text-gray-500">Advance Investment Protection Platform</p>
                  </div>
                  {currentApp === 'app2' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsSwitchAppModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}