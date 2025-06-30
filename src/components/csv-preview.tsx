import React from "react";
import { X } from "lucide-react";

interface CSVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  onConfirm: () => void;
}

const CSVPreviewModal: React.FC<CSVPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm,
}) => {
  if (!data.length || !isOpen) return null;

  const columns = Object.keys(data[0]);
  const previewData = data.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold dark:text-white">
            Preview CSV Data
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    {columns.map((column) => (
                      <td
                        key={`${rowIndex}-${column}`}
                        className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 5 && (
            <p className="mt-4 text-sm text-gray-500">
              Showing first 5 rows of {data.length} total rows
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-blue-600 rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700">
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVPreviewModal;
