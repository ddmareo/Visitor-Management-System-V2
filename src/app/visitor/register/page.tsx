"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { encrypt, decrypt } from "@/utils/encryption";
import Turnstile from "react-turnstile";
import Async from "react-select/async";
import heicConvert from "heic-convert/browser";

interface Company {
  id: string;
  name: string;
}

interface FormField {
  id: string;
  label: string;
  enabled: boolean;
  required: boolean;
  type: string;
}

const Page = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompanyField, setShowNewCompanyField] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [formConfig, setFormConfig] = useState<FormField[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    nomorktp: "",
    phone: "",
    email: "",
    address: "",
  });

  const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

  const createWatermarkSVG = (width: number, height: number) => {
    const fontSize = Math.min(width, height) * 0.1;
    const spacing = fontSize * 2;

    let svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <style>
            text { font-family: Arial, sans-serif; }
          </style>
        </defs>
    `;

    for (let x = -spacing; x < width + spacing; x += spacing * 1.5) {
      for (let y = -spacing; y < height + spacing; y += spacing * 1.5) {
        const rotationAngle = -30 + (Math.random() * 20 - 10);
        svgContent += `
          <text 
            x="${x}" 
            y="${y}" 
            font-size="${fontSize}" 
            font-weight="bold" 
            fill="rgba(0, 0, 0, 0.3)" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            transform="rotate(${rotationAngle} ${x} ${y})">
            UNTUK ALVA
          </text>`;
      }
    }
    svgContent += "</svg>";
    return svgContent.trim();
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);

      const converted = await heicConvert({
        buffer: fileBuffer as unknown as Buffer & ArrayBufferLike,
        format: "JPEG",
        quality: 0.8,
      });

      const convertedFile = new File(
        [new Uint8Array(converted)],
        file.name.replace(/\.(heic|heif)$/i, ".jpg"),
        { type: "image/jpeg" }
      );

      return convertedFile;
    } catch (error) {
      console.error("HEIC conversion error:", error);
      throw new Error("Failed to convert HEIC/HEIF image");
    }
  };

  const createWatermarkedPreview = async (file: File) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    try {
      const isHeicHeif = /\.(heic|heif)$/i.test(file.name);
      let processedFile = file;

      if (isHeicHeif) {
        try {
          processedFile = await convertHeicToJpeg(file);
        } catch (error) {
          console.error("Failed to convert HEIC/HEIF image:", error);
          throw new Error(
            "Failed to convert HEIC/HEIF image. Please try a JPEG or PNG file instead."
          );
        }
      }

      const imageUrl = URL.createObjectURL(processedFile);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      ctx?.drawImage(img, 0, 0);

      const watermarkSvg = createWatermarkSVG(img.width, img.height);
      const watermarkUrl = `data:image/svg+xml;base64,${btoa(watermarkSvg)}`;

      const watermarkImg = new Image();
      await new Promise((resolve, reject) => {
        watermarkImg.onload = resolve;
        watermarkImg.onerror = reject;
        watermarkImg.src = watermarkUrl;
      });

      ctx?.drawImage(watermarkImg, 0, 0);

      const previewDataUrl = canvas.toDataURL("image/jpeg");
      setPreviewUrl(previewDataUrl);

      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("Error creating preview:", error);
      setError(
        "Failed to generate preview: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const response = await axios.get("/api/formconfig");
        setFormConfig(response.data);
      } catch (error) {
        console.error("Error fetching form configuration:", error);
      }
    };

    fetchFormConfig();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("/api/register");
        if (Array.isArray(response.data)) {
          setCompanies(response.data);
        } else {
          setError("Format data tidak valid yang diterima dari server");
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        setError("Gagal memuat perusahaan");
      }
    };

    fetchCompanies();
  }, [router]);

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

  useEffect(() => {
    const storedNIK = sessionStorage.getItem("visitorNIK");
    if (storedNIK) {
      try {
        const decryptedNIK = decrypt(storedNIK);
        setFormData((prevData) => ({ ...prevData, nomorktp: decryptedNIK }));
      } catch (error) {
        console.error("Failed to decrypt NIK:", error);
      }
    } else {
      router.push("/");
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "company") {
      setShowNewCompanyField(value === "others");
      setNewCompanyName("");
    }

    setFormData({ ...formData, [name]: value });
  };

  const filterCompanies = (inputValue: string) => {
    return companies.filter((company) =>
      company.name.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const loadOptions = (inputValue: string, callback: any) => {
    setTimeout(() => {
      if (!inputValue) {
        callback([{ value: "others", label: "Lainnya" }]);
      } else {
        const filteredCompanies = filterCompanies(inputValue).map(
          (company) => ({
            value: company.id,
            label: company.name,
          })
        );
        callback([...filteredCompanies, { value: "others", label: "Lainnya" }]);
      }
    }, 500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validExtensions = [".jpg", ".jpeg", ".png", ".heic", ".heif"];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.slice(fileName.lastIndexOf("."));
      if (!validExtensions.includes(fileExtension)) {
        setError("Hanya format JPG, PNG, dan HEIC/HEIF yang diperbolehkan");
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file harus kurang dari 5MB");
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedFile(file);
      setError(null);
      await createWatermarkedPreview(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    if (!turnstileToken) {
      setError("Please complete the security verification");
      return;
    }

    if (!formData.company || formData.company.trim() === "") {
      setError("Perusahaan/Institusi harus dipilih atau diisi.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      submitFormData.append("token", turnstileToken);
      submitFormData.append("csrfToken", csrfToken || "");
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "nomorktp") {
          const encryptedNIK = encrypt(value);
          submitFormData.append(key, encryptedNIK);
        } else if (key === "company" && showNewCompanyField) {
          submitFormData.append("company", newCompanyName);
          submitFormData.append("isNewCompany", "true");
        } else {
          submitFormData.append(key, value);
        }
      });

      if (selectedFile) {
        submitFormData.append("idCard", selectedFile);
      }

      const response = await axios.post("/api/register", submitFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Registration successful:", response.data);
      router.push(`/visitor/booking`);
    } catch (error) {
      console.error("Registration error:", error);
      setError("Terjadi kesalahan saat pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 pt-[calc(6rem)] pb-9">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-md w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pendaftaran Pengunjung
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Silakan isi detail Anda di bawah ini
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label
              htmlFor="name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Nama Lengkap
              <RequiredIndicator />
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Masukkan nama lengkap Anda (e.g., Ahmad Setiawan)
            </p>
          </div>
          <div className="mb-5">
            <label
              htmlFor="company"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Perusahaan/Institusi
              <RequiredIndicator />
            </label>
            <Async
              id="company"
              name="company"
              placeholder="Cari perusahaan..."
              loadOptions={loadOptions}
              defaultOptions
              onChange={(selectedOption: any) => {
                const selectedValue = selectedOption?.value || "";
                handleChange({
                  target: { name: "company", value: selectedValue },
                } as React.ChangeEvent<HTMLSelectElement>);
              }}
              className="text-dark-900 dark:bg-gray-700 dark:text-dark-900"
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  borderColor: "#d1d5db",
                  "&:hover": {
                    borderColor: "#9ca3af",
                  },
                }),
                input: (baseStyles) => ({
                  ...baseStyles,
                  color: "black",
                }),
                option: (baseStyles) => ({
                  ...baseStyles,
                  color: "black",
                }),
                singleValue: (baseStyles) => ({
                  ...baseStyles,
                  color: "black",
                }),
              }}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Ketik nama perusahaan Anda dan pilih dari daftar. Jika tidak ada,
              pilih opsi Lainnya.
            </p>
          </div>

          {showNewCompanyField && (
            <div className="mb-5">
              <label
                htmlFor="newCompany"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Nama Perusahaan Baru
                <RequiredIndicator />
              </label>
              <input
                type="text"
                id="newCompany"
                value={newCompanyName}
                onChange={(e) =>
                  setNewCompanyName(e.target.value.toUpperCase())
                }
                className="uppercase bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Masukkan nama perusahaan Anda (e.g., PT. ILECTRA MOTOR GROUP)
              </p>
            </div>
          )}
          <div className="mb-5">
            <label
              htmlFor="nomorktp"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Nomor KTP (NIK)
              <RequiredIndicator />
            </label>
            <input
              type="text"
              id="nomorktp"
              name="nomorktp"
              value={formData.nomorktp}
              onChange={handleChange}
              readOnly
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
          </div>
          <div className="flex mb-5 space-x-2">
            <div className="w-full">
              <label
                htmlFor="phone"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Nomor Telepon
                <RequiredIndicator />
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            {formConfig.find((field) => field.id === "email")?.enabled && (
              <div className="w-full">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Email
                  {formConfig.find((field) => field.id === "email")
                    ?.required && <RequiredIndicator />}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required={
                    formConfig.find((field) => field.id === "email")?.required
                  }
                />
              </div>
            )}
          </div>
          {formConfig.find((field) => field.id === "address")?.enabled && (
            <div className="mb-5">
              <label
                htmlFor="address"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Alamat Lengkap
                {formConfig.find((field) => field.id === "address")
                  ?.required && <RequiredIndicator />}
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required={
                  formConfig.find((field) => field.id === "address")?.required
                }
              />
            </div>
          )}
          {formConfig.find((field) => field.id === "idCard")?.enabled && (
            <div className="mb-5">
              <label
                htmlFor="file"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Pindaian Kartu Identitas (Scan KTP)
                {formConfig.find((field) => field.id === "idCard")
                  ?.required && <RequiredIndicator />}
              </label>
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.heic,.heif"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required={
                  formConfig.find((field) => field.id === "idCard")?.required
                }
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Format yang didukung: JPG, PNG, HEIC/HEIF (Maks. 5MB)
              </p>

              {previewUrl && (
                <div className="mt-4">
                  <div className="max-w-md mx-auto bg-gray-100 dark:bg-gray-700 p-4 shadow-md rounded-lg border border-gray-300 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-3.5">
                      Hasil pindaian KTP Anda akan diberi watermark seperti yang
                      terlihat pada preview di bawah ini.
                    </p>
                    <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-start mb-5">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                name="terms"
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="terms"
                className="text-sm text-gray-600 dark:text-gray-300">
                Saya telah membaca dan menyetujui{" "}
                <a
                  className="font-medium text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300 underline"
                  href="/terms-conditions"
                  target="_blank"
                  rel="noopener noreferrer">
                  Syarat dan Ketentuan
                </a>{" "}
                yang ada di situs web ini.
              </label>
            </div>
          </div>
          <div className="flex justify-center items-center mt-8">
            <button
              type="submit"
              disabled={isLoading || !turnstileToken || !csrfToken}
              className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-500 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:text-black dark:bg-white dark:hover:bg-gray-100 dark:focus:ring-gray-300 disabled:opacity-70 disabled:cursor-not-allowed">
              {!turnstileToken || !csrfToken
                ? "Loading..."
                : isLoading
                ? "Mendaftar..."
                : "Daftar Pengunjung"}
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900 p-3 rounded-lg mt-5">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="my-4">
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onVerify={(token) => setTurnstileToken(token)}
            />
          </div>
        </form>
      </div>
    </main>
  );
};

export default Page;
