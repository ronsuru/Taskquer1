import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampaignForm from "./CampaignForm";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function CreateCampaignModal({ isOpen, onClose, userId }: CreateCampaignModalProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  
  const handleCloseAttempt = () => {
    // Only show warning if there are unsaved changes
    if (hasUnsavedChanges) {
      setShowWarning(true);
    } else {
      // No changes, close immediately
      onClose();
    }
  };
  
  const handleConfirmClose = () => {
    console.log('handleConfirmClose called');
    setShowWarning(false);
    onClose();
  };
  
  const handleCancelClose = () => {
    console.log('handleCancelClose called, setting showWarning to false');
    console.log('Current showWarning state:', showWarning);
    setShowWarning(false);
    console.log('After setShowWarning(false)');
  };

  // Reset draft when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDraft(null);
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);
  
  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleCloseAttempt();
          }
        }}
      >
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto scrollbar-hide rounded-lg p-4 sm:max-w-[600px] sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              🎯 Create New Campaign
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-2 sm:mt-4">
            <CampaignForm 
              userId={userId} 
              onClose={onClose}
              onFormChange={setHasUnsavedChanges}
              selectedDraft={selectedDraft}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Warning Modal */}
      {showWarning && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 999999 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl relative z-[999999]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You have unsaved changes in your campaign form. Are you sure you want to close without saving?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
