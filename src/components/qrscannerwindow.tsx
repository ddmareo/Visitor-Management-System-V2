import React from "react";
import QrScannerComponent from "./qrscanner";

interface QrScannerPopupProps {
  onClose: () => void;
  onScanSuccess: (scannedUrl: string) => void;
}

const QrScannerPopup: React.FC<QrScannerPopupProps> = ({
  onClose,
  onScanSuccess,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
      <div className="relative bg-white rounded-lg overflow-hidden">
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-0 right-0 p-2 text-gray-600">
          ✕
        </button>
        <QrScannerComponent onScanSuccess={onScanSuccess} />
      </div>
    </div>
  );
};

export default QrScannerPopup;
