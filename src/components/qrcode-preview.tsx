import React from "react";
import { X } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeImage?: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrCodeImage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-4 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 p-2 hover:bg-gray-100 rounded-full">
          <X className="h-5 w-5 dark:text-white" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex items-center justify-center p-6">
          {qrCodeImage && (
            <img
              src={qrCodeImage}
              alt="QR Code"
              className="max-w-full h-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
