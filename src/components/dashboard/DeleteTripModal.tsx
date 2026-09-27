'use client';

import React from 'react';

interface DeleteTripModalProps {
  isOpen: boolean;
  actionLoading: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const DeleteTripModal: React.FC<DeleteTripModalProps> = ({
  isOpen,
  actionLoading,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center space-x-3 mb-4 text-red-600">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Trip</h3>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete this trip itinerary? All unfinished tasks will be removed. This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            disabled={actionLoading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={actionLoading}
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center space-x-2"
          >
            {actionLoading ? <span>Deleting...</span> : <span>Delete Trip</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
