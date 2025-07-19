"use client";

import React, { useState, useEffect } from "react";
import { Save, AlertCircle, Check } from "lucide-react";
import axios from "axios";

interface FormField {
  id: string;
  label: string;
  enabled: boolean;
  required: boolean;
  type: string;
}

const FormConfigPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: "email",
      label: "Email",
      enabled: true,
      required: true,
      type: "email",
    },
    {
      id: "address",
      label: "Alamat Lengkap",
      enabled: true,
      required: true,
      type: "text",
    },
    {
      id: "idCard",
      label: "Pindaian Kartu Identitas (Scan KTP)",
      enabled: true,
      required: true,
      type: "file",
    },
    {
      id: "faceScan",
      label: "Scan Wajah (Selfie)",
      enabled: true,
      required: true,
      type: "photo",
    },
  ]);

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const response = await axios.get("/api/formconfig");
        if (response.data) {
          setFormFields(response.data);
        }
      } catch (error) {
        console.error("Error fetching form configuration:", error);
        setError("Failed to load form configuration");
      }
    };

    fetchFormConfig();
  }, []);

  const handleFieldToggle = (fieldId: string, type: "enabled" | "required") => {
    setFormFields((prevFields) =>
      prevFields.map((field) => {
        if (field.id === fieldId) {
          if (type === "enabled") {
            return {
              ...field,
              enabled: !field.enabled,
              required: field.enabled ? false : field.required,
            };
          } else {
            return { ...field, required: !field.required };
          }
        }
        return field;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await axios.post("/api/formconfig", { fields: formFields });
      setSuccessMessage("Form configuration saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving form configuration:", error);
      setError("Failed to save form configuration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Registration Form Configuration
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Enable or disable form fields and set their requirements for the
              visitor registration form.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {formFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {field.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Field type: {field.type}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.enabled}
                          onChange={() =>
                            handleFieldToggle(field.id, "enabled")
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {field.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.required}
                          onChange={() =>
                            handleFieldToggle(field.id, "required")
                          }
                          disabled={!field.enabled}
                        />
                        <div
                          className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                            !field.enabled
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}></div>
                        <span
                          className={`ml-2 text-sm font-medium ${
                            field.enabled ? "text-gray-700" : "text-gray-400"
                          }`}>
                          {field.required ? "Required" : "Optional"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-md flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-4 bg-green-50 rounded-md flex items-center space-x-2 text-green-700">
                <Check className="h-5 w-5" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default FormConfigPage;
