"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

const QRCodeContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrCode = searchParams.get("qrCode");

  return (
    <div>
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-md w-full max-w-xl">
          <h1 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
            Kunjungan Anda telah berhasil dipesan!
          </h1>
          <p className="mb-6 text-gray-600 text-center dark:text-gray-300">
            Pada tanggal kunjungan, mohon tunjukkan kode QR di bawah ini kepada
            petugas keamanan
          </p>
          <div className="flex justify-center">
            <img
              src={qrCode as string}
              alt="QR Code"
              className="border rounded-lg shadow-md"
            />
          </div>
          <div className="flex justify-center mt-8 space-x-2">
            <a
              href={qrCode as string}
              download="qr_code.png"
              className="text-black bg-white hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200 border border-gray-300">
              Simpan QR
            </a>
            <button
              onClick={() => router.push("/")}
              className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition duration-200">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Page = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <QRCodeContent />
  </Suspense>
);

export default Page;
