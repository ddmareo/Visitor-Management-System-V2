import React from "react";
import {
  Shield,
  Camera,
  Wifi,
  Trash2,
  Cigarette,
  HardHat,
  IdCard,
  AlertCircle,
} from "lucide-react";

const Page = () => {
  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 pt-[calc(56px)]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-gray-900 dark:text-gray-100 mb-0.5" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Informasi Pengunjung
          </h1>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <div className="space-y-3">
              <p className="text-gray-900 dark:text-white font-medium">
                Pastikan Anda mematuhi persyaratan berikut ini:
              </p>
              <ol className="text-gray-800 dark:text-gray-200 space-y-2 list-decimal ml-4">
                <li className="pl-2">
                  <p>
                    Pengunjung harus dipandu/diawasi oleh Karyawan ALVA Plant
                    selama berada di area Pabrik ALVA.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Informasi dan data pengunjung yang diberikan kepada ALVA
                    Plant harus harus valid dan benar.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Informasi dan data pengunjung berada di bawah tanggung jawab
                    ALVA Plant dan akan dilindungi sepenuhnya dari pelanggaran
                    privasi.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Pengunjung diwajibkan untuk mengenakan perlengkapan
                    keselamatan (APD) sebelum memasuki area produksi.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Pengunjung harus menyetujui Peraturan ALVA Plant dan
                    bersedia untuk mematuhi semua permintaan, sebagai berikut:
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <IdCard className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              1. Kartu Akses Pengunjung
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Diperlukan Kartu Akses Pengunjung
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Camera className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              2. Dilarang Memotret
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Semua kamera dan port harus tertutup rapat
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Wifi className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              3. Tanpa Akses Jaringan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Jangan sambungkan ke port Data/LAN
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Trash2 className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              4. Tidak Membuang Sampah Sembarangan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Jaga kebersihan tempat
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Cigarette className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              5. Dilarang Merokok
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Dilarang keras merokok
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <HardHat className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              6. Protokol Keamanan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Ikuti semua panduan keselamatan & kesehatan
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
