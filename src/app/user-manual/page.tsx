"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  User,
  Clipboard,
  QrCode,
} from "lucide-react";
import NIKInput from "@/app/images/nik_input.png";
import Company from "@/app/images/company.png";
import NIKField from "@/app/images/nik_field.png";
import Checkbox from "@/app/images/checkbox.png";
import VisitBooking from "@/app/images/visit_booking.png";
import TeamMember from "@/app/images/team_member.png";
import EmployeeEntry from "@/app/images/employee_entry.png";
import VisitCategory from "@/app/images/visit_category.png";
import EntryMethod from "@/app/images/entry_method.png";
import QRPage from "@/app/images/qr_code.png";
import VisitProcess from "@/app/images/visit_process.png";
import VisitorRegistration from "@/app/images/visitor_registration.png";

const UserManualPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const sections = [
    {
      icon: <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Pendaftaran Pengunjung",
      content: (
        <>
          <p className="font-semibold">
            Ikuti langkah-langkah berikut untuk mendaftar sebagai pengunjung:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              Masukkan NIK (Nomor Induk Kependudukan) 16 digit Anda pada kolom
              yang tersedia. Pastikan hanya berisi angka. Entri yang tidak valid
              akan menampilkan kesalahan.
              <img
                src={NIKInput.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Klik tombol <strong>Lanjutkan</strong>. Jika NIK Anda tidak
              terdaftar, Anda akan diarahkan ke halaman{" "}
              <strong>Pendaftaran Pengunjung</strong>. Silakan lengkapi formulir
              pendaftaran dengan benar.
            </li>
            <li>
              Berikut adalah Halaman Pendaftaran Pengunjung. Silakan isi nama
              lengkap Anda sebagai langkah pertama untuk mengisi formulir ini.
              <img
                src={VisitorRegistration.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Pada bidang perusahaan/instansi, pilih dari daftar atau pilih
              Lainnya untuk memasukkan nama perusahaan Anda jika tidak tersedia
              dalam daftar.
              <img
                src={Company.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Kolom input NIK akan terisi otomatis dengan NIK dari halaman
              utama. Kolom ini wajib diisi; jika kosong, silakan ulangi proses
              di halaman utama.
              <img
                src={NIKField.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Silakan unggah scan kartu identitas dalam format PNG atau JPG,
              dengan ukuran maksimal 5 MB. Anda juga harus mencentang kotak
              untuk menyetujui syarat dan ketentuan kami.
              <img
                src={Checkbox.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Klik <strong>Daftar</strong> untuk menyelesaikan proses. Setelah
              berhasil, Anda akan dialihkan ke halaman{" "}
              <strong>Pemesanan Kunjungan</strong>.
            </li>
          </ol>
        </>
      ),
    },
    {
      icon: (
        <Clipboard className="w-6 h-6 text-green-600 dark:text-green-400" />
      ),
      title: "Pemesanan Kunjungan",
      content: (
        <>
          <p className="font-semibold">
            Ikuti langkah-langkah berikut untuk memesan kunjungan:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              Ada dua cara untuk mengakses halaman{" "}
              <strong>Pemesanan Kunjungan</strong>: dengan memasukkan NIK di
              halaman utama, dengan syarat sudah terdaftar, atau setelah
              menyelesaikan pendaftaran pengunjung.
            </li>
            <li>
              Setelah sampai di halaman Pemesanan Kunjungan, Anda harus
              melengkapi detail kunjungan. Nama dan perusahaan Anda akan terisi
              otomatis berdasarkan NIK. Kedua kolom ini wajib diisi dan jika
              kosong, silakan ulangi proses dari halaman utama.
              <img
                src={VisitBooking.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Jika Anda membawa anggota tim, pilih Ya. Dua kolom baru akan
              muncul: satu untuk jumlah anggota tim dan satu lagi untuk nama
              mereka. Jika Anda tidak membawa anggota tim, pilih Tidak dan
              lanjutkan.
              <img
                src={TeamMember.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Pada kolom karyawan, pilih nama karyawan yang ingin Anda temui
              dari daftar. Untuk tanggal awal dan akhir kunjungan, tentukan
              tanggal kunjungan Anda.
              <img
                src={EmployeeEntry.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Pada kolom Kategori Kunjungan, pilih sebuah opsi. Jika Anda
              memilih Kerja (Proyek & Perbaikan), kolom izin keselamatan menjadi
              wajib. Jika tidak, tidak diperlukan.
              <img
                src={VisitCategory.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Pada kolom Metode Masuk, pilih antara Walking (Berjalan) atau
              Vehicle (Kendaraan). Jika Anda memilih Vehicle (Kendaraan), Anda
              harus mencantumkan nomor kendaraan. Jika memilih Walking
              (Berjalan), opsi ini tidak akan tersedia.
              <img
                src={EntryMethod.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
            <li>
              Klik <strong>Pesan Kunjungan</strong> untuk menyelesaikan proses.
              Setelah berhasil, Anda akan diarahkan ke halaman Kode QR. Di sini,
              Anda dapat mengambil tangkapan layar Kode QR atau klik tombol
              Simpan QR untuk menyimpannya ke galeri. Kode QR sangat penting
              untuk proses kunjungan, jadi pastikan membawanya.
              <img
                src={QRPage.src}
                className="object-contain w-full rounded-lg shadow-md my-3"
              />
            </li>
          </ol>
        </>
      ),
    },
    {
      icon: <QrCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      title: "Proses Kunjungan",
      content: (
        <>
          <p className="font-semibold">
            Ikuti langkah-langkah berikut selama proses kunjungan:
          </p>
          <img
            src={VisitProcess.src}
            className="object-contain w-full rounded-lg shadow-md my-3"
          />
        </>
      ),
    },
  ];

  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 pt-[calc(4rem)] pb-2">
      <div className="max-w-4xl w-full mx-auto p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Visitor Management System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Panduan pengguna komprehensif untuk membantu Anda dalam pendaftaran
            pengunjung, pemesanan kunjungan, dan proses kunjungan.
          </p>
        </header>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-4">
                  {section.icon}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {section.title}
                  </span>
                </div>
                {activeSection === section.title ? (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              {activeSection === section.title && (
                <div className="p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <p>{section.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default UserManualPage;
