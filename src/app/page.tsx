"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { AlertCircle, ArrowRight } from "lucide-react";
import { encrypt } from "@/utils/encryption";
import Image from "next/image";
import logoWhite from "./images/logo_white.png";
import Turnstile from "react-turnstile";

export default function Home() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get("/api/csrf");
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (!turnstileToken) {
      setError("Please complete the security check.");
      setIsLoading(false);
      return;
    }

    const nikWithoutSpaces = nik.replace(/\s+/g, "");

    if (!/^\d+$/.test(nikWithoutSpaces)) {
      setError("NIK hanya boleh terdiri dari angka.");
      setIsLoading(false);
      return;
    }

    if (nikWithoutSpaces.length !== 16) {
      setError("NIK harus terdiri dari 16 digit.");
      setIsLoading(false);
      return;
    }

    try {
      const encryptedNIK = await encrypt(nikWithoutSpaces);
      const response = await axios.post("/api/visitors/checknik", {
        nik: encryptedNIK,
        token: turnstileToken,
        csrfToken,
      });
      sessionStorage.setItem("visitorNIK", encryptedNIK);

      if (response.data.exists) {
        router.push("/visitor/booking");
      } else {
        router.push("/visitor/register");
      }
    } catch (error) {
      console.error("Error checking NIK:", error);
      setError("Terjadi kesalahan. Silakan coba lagi nanti.");
      setIsLoading(false);
    }
  };

  const formatNIK = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const chunks = numbers.match(/.{1,4}/g) || [];
    return chunks.join(" ").substr(0, 19);
  };

  const handleNIKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNIK(e.target.value);
    setNik(formatted);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Card Header with Gradient */}
            {/* <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white"> */}
            <div className="bg-black p-6 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white bg-opacity-25 p-3 rounded-full">
                  {/* <CreditCard className="h-6 w-6 text-black" /> */}
                  {/* <img src="./images/logo_white.png" alt="Logo" className="w-[100px] h-auto" /> */}

                  <Image src={logoWhite} alt="Logo White" width={150} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center">Selamat datang</h2>
              <p className="text-center text-indigo-100 mt-2">
                Masukkan NIK (Nomor Induk Kependudukan) Anda
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="NIK"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NIK
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="NIK"
                    value={nik}
                    onChange={handleNIKChange}
                    placeholder="XXXX XXXX XXXX XXXX"
                    className="w-full px-4 py-3 text-center text-lg text-black tracking-wider border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 ease-in-out font-medium 
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400"
                    maxLength={19}
                    required
                  />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 dark:group-hover:border-indigo-400 rounded-lg pointer-events-none transition-all duration-200 ease-in-out"></div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/30 p-3 rounded-lg mt-5">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="my-4">
                <Turnstile
                  sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onVerify={(token) => setTurnstileToken(token)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !turnstileToken || !csrfToken}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-[#33FFC9] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transform transition-all duration-200 ease-in-out hover:scale-[1.02] dark:bg-emerald-500 dark:hover:bg-emerald-600 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? (
                  <span>Memproses...</span>
                ) : !turnstileToken || !csrfToken ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <span>Lanjutkan</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-300">
                © 2025 Visitor Management System v1.14
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
