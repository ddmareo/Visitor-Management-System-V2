"use client";

import React, { useState } from "react";
import { Check, QrCode, Search, Image } from "lucide-react";
import QrScannerPopup from "./qrscannerwindow";
import axios from "axios";
import { useSession } from "next-auth/react";
import FaceScanModal from "./facescanmodal";

interface VisitsData {
  visit_id: string;
  visitor_id: string;
  visitor_name: string;
  company_institution: string;
  employee_name: string;
  security_name?: string;
  entry_start_date: string;
  check_in_time: string;
  check_out_time: string;
  visit_category: string;
  entry_method: string;
  vehicle_number?: string;
  verification_status: boolean;
  brings_team: boolean;
  team_members_quantity?: number;
  team_members?: string;
  face_descriptor?: number[];
  face_scan?: string;
}

const Page = () => {
  const [qrCode, setQrCode] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [visitsData, setVisitsData] = useState<VisitsData | null>(null);
  const [error, setError] = useState("");
  const [isCheckinIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { data: session } = useSession();

  // verif states
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [showFaceScanImage, setShowFaceScanImage] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isVerifying, setIsVerifying] = useState(false);

  const handleQrScanSuccess = (scannedUrl: string) => {
    setQrCode(scannedUrl);
    setShowQrScanner(false);
    fetchVisitsData(scannedUrl);
  };

  const fetchVisitsData = async (qrCode: string) => {
    setError("");
    try {
      const res = await axios.get<VisitsData>(`/api/visits/${qrCode}`);
      setVisitsData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setVisitsData(null);
    }
  };

  const handleSearch = () => {
    if (qrCode) {
      fetchVisitsData(qrCode);
    } else {
      setError("Please enter a QR code");
    }
  };

  const handleVerificationComplete = (success: boolean, name?: string) => {
    setShowCamera(false);
    if (success) {
      fetchVisitsData(qrCode);
    }
    console.log(name + " successfully verified.");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  const handleManualVerification = async () => {
    if (!visitsData?.visit_id) return;

    setIsVerifying(true);
    setError("");

    try {
      await axios.put(`/api/visits/verify/${visitsData.visit_id}`, {
        manual: true,
      });
      await fetchVisitsData(qrCode);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Manual verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!visitsData?.visit_id) return;

    setIsCheckingIn(true);
    setError("");

    try {
      const currentDate = new Date();
      const startDate = new Date(visitsData.entry_start_date);

      currentDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);

      if (currentDate < startDate) {
        throw new Error(
          "Cannot check in before the scheduled entry start date"
        );
      }

      if (currentDate > startDate) {
        throw new Error("Cannot check in after the scheduled entry start date");
      }

      await axios.put(`/api/visits/checkin/${visitsData.visit_id}`);
      await fetchVisitsData(qrCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!visitsData?.visit_id) return;

    setIsCheckingOut(true);
    setError("");

    try {
      const currentDate = new Date();
      const startDate = new Date(visitsData.entry_start_date);

      currentDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);

      if (currentDate < startDate) {
        throw new Error(
          "Check out must be done on the same day as the check-in"
        );
      }

      if (currentDate > startDate) {
        throw new Error(
          "Check out must be done on the same day as the check-in"
        );
      }

      await axios.put(`/api/visits/checkout/${visitsData.visit_id}`);
      await fetchVisitsData(qrCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-out failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const openIdCard = async () => {
    if (!visitsData?.visitor_id) return;
    try {
      const response = await axios.get(
        `/api/table/visitorsdata/idcard/${visitsData.visitor_id}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const imageUrl = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>ID Card</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="ID Card" />
            </body>
          </html>
        `);

        newWindow.onunload = () => {
          URL.revokeObjectURL(imageUrl);
        };

        newWindow.document.close();
      }
    } catch (error) {
      console.error("Error fetching ID card:", error);
      alert("Failed to load ID Card image");
    }
  };

  const openSafetyPermit = async () => {
    if (!visitsData?.visit_id) return;

    try {
      const response = await axios.get(
        `/api/table/visitsdata/safety/${visitsData.visit_id}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const imageUrl = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Safety Permit</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="Safety Permit" />
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Error fetching safety permit:", error);
      alert("Failed to load safety permit image");
    }
  };

  const methodLabels: Record<string, string> = {
    Walking: "Walking",
    Vehicle_Roda_Dua: "Vehicle (Roda Dua)",
    Vehicle_Roda_Empat: "Vehicle (Roda Empat)",
  };

  return (
    <div className="my-8 w-full md:w-2/3 lg:w-1/3 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div>
          <label
            htmlFor="qr_code"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            QR Code
          </label>
          <div className="flex flex-col sm:flex-row">
            <input
              type="text"
              id="qr_code"
              name="qr_code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              required
            />
            <button
              className="mt-2 sm:mt-0 sm:ml-3 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-black dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:bg-gray-900"
              aria-label="Search"
              type="button"
              onClick={handleSearch}>
              <Search className="w-5 h-5" />
              <span className="sr-only">Search</span>
            </button>
            <button
              className="mt-2 sm:mt-0 sm:ml-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-black dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:bg-gray-900"
              aria-label="Open QR Code"
              type="button"
              onClick={() => setShowQrScanner(true)}>
              <QrCode className="w-5 h-5" />
              <span className="sr-only">QR Code</span>
            </button>
          </div>
        </div>
      </form>

      {visitsData && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h5 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Visit Card
            </h5>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Basic Information
                  </h2>
                  <dl className="space-y-2">
                    {[
                      ["Name", visitsData.visitor_name],
                      ["Company", visitsData.company_institution],
                      ["Employee", visitsData.employee_name],
                      ["Security", visitsData.security_name || "-"],
                      [
                        "ID Card",
                        <button
                          key="id-card-button"
                          onClick={openIdCard}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                          View Content
                        </button>,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="flex justify-between">
                        <dt className="text-sm text-gray-600 dark:text-gray-400">
                          {label}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Visit Time
                  </h2>
                  <dl className="space-y-2">
                    {[
                      [
                        "Entry Start Date",
                        new Date(
                          visitsData.entry_start_date
                        ).toLocaleDateString("en-GB"),
                      ],
                      [
                        "Check-In",
                        visitsData.check_in_time
                          ? new Date(
                              visitsData.check_in_time
                            ).toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })
                          : "-",
                      ],
                      [
                        "Check-Out",
                        visitsData.check_out_time
                          ? new Date(
                              visitsData.check_out_time
                            ).toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })
                          : "-",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <dt className="text-sm text-gray-600 dark:text-gray-400">
                          {label}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Visit Information
                  </h2>
                  <dl className="space-y-2">
                    {[
                      ["Visit Category", visitsData.visit_category],
                      [
                        "Safety Permit",
                        visitsData.visit_category ===
                        "Working (Project & Repair)" ? (
                          <button
                            onClick={openSafetyPermit}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                            View Content
                          </button>
                        ) : (
                          "-"
                        ),
                      ],
                      ["Entry Method", methodLabels[visitsData.entry_method]],
                      ["Vehicle Number", visitsData.vehicle_number || "-"],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="flex justify-between">
                        <dt className="text-sm text-gray-600 dark:text-gray-400">
                          {label}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Other Information
                  </h2>
                  <dl className="space-y-2">
                    {[
                      [
                        "Verification Status",
                        visitsData.verification_status ? "Yes" : "No",
                      ],
                      ["Brings Team", visitsData.brings_team ? "Yes" : "No"],
                      [
                        "Team Members Quantity",
                        visitsData.team_members_quantity || "-",
                      ],
                      [
                        "Team Members",
                        Array.isArray(visitsData.team_members) &&
                        visitsData.team_members.length > 0 ? (
                          visitsData.team_members.length === 1 ? (
                            visitsData.team_members[0]
                          ) : (
                            <ul className="list-disc pl-5 space-y-1">
                              {visitsData.team_members.map((member, index) => (
                                <li
                                  key={index}
                                  className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {member}
                                </li>
                              ))}
                            </ul>
                          )
                        ) : (
                          "-"
                        ),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="flex justify-between">
                        <dt className="text-sm text-gray-600 dark:text-gray-400">
                          {label}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center">
              {!visitsData.verification_status ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMode(mode === "camera" ? "manual" : "camera")
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        mode === "manual"
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-600"
                      }`}>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mode === "manual" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Manual
                    </label>
                    {mode === "manual" && visitsData?.face_scan && (
                      <button
                        onClick={() => setShowFaceScanImage(true)}
                        className="p-2 text-blue-600 hover:text-blue-800">
                        <Image className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    className="inline-flex ml-auto items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 focus:ring-blue-500"
                    onClick={
                      mode === "camera"
                        ? () => setShowCamera(true)
                        : handleManualVerification
                    }
                    disabled={isVerifying}>
                    {isVerifying
                      ? "Verifying..."
                      : mode === "camera"
                      ? "Verify Face"
                      : "Manual Verify"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    Visitor verified
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                {!(visitsData.check_in_time && visitsData.check_out_time) &&
                  session?.user?.role === "security" &&
                  visitsData.verification_status && (
                    <button
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${
                        isCheckinIn || isCheckingOut
                          ? "opacity-50 cursor-not-allowed"
                          : visitsData.check_in_time
                          ? "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500"
                          : "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 focus:ring-green-500"
                      }`}
                      onClick={
                        visitsData.check_in_time
                          ? handleCheckOut
                          : handleCheckIn
                      }
                      disabled={isCheckinIn || isCheckingOut}>
                      {isCheckinIn
                        ? "Checking In..."
                        : isCheckingOut
                        ? "Checking Out..."
                        : visitsData.check_in_time
                        ? "Check Out"
                        : "Check In"}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showQrScanner && (
        <QrScannerPopup
          onClose={() => setShowQrScanner(false)}
          onScanSuccess={handleQrScanSuccess}
        />
      )}

      {showCamera && (
        <FaceScanModal
          mode="verify"
          visitId={visitsData?.visit_id}
          faceDescriptor={visitsData?.face_descriptor}
          onVerificationComplete={handleVerificationComplete}
          onClose={() => setShowCamera(false)}
        />
      )}

      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-xl">
          {error}
        </div>
      )}

      {showFaceScanImage && visitsData?.face_scan && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFaceScanImage(false)}>
          <div className="w-3/4 h-3/4 flex items-center justify-center">
            <img
              src={visitsData?.face_scan}
              alt="Face Scan"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
