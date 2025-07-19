"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Turnstile from "react-turnstile";
import Async from "react-select/async";

const Page = () => {
  const router = useRouter();

  type Employee = {
    employee_id: number;
    name: string;
  };

  type VisitCategory =
    | "Meeting___Visits"
    | "Delivery"
    | "Working__Project___Repair_"
    | "VIP";

  const [nik, setNik] = useState<string | null>(null);
  const [visitor, setVisitor] = useState({ name: "", company: "" });
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<VisitCategory[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [safetyPermitFile, setSafetyPermitFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bringTeam, setBringTeam] = useState<boolean | null>(null);
  const [teamMemberCount, setTeamMemberCount] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formData, setFormData] = useState({
    employee: 0,
    entry_start_date: "",
    category: "",
    method: "",
    vehicle: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const checkNIK = async () => {
      const storedNIK = sessionStorage.getItem("visitorNIK");
      if (!storedNIK) {
        router.push("/");
        return;
      }
      setNik(storedNIK);
    };

    checkNIK();
  }, [router]);

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const storedNIK = sessionStorage.getItem("visitorNIK");

        if (storedNIK) {
          const response = await axios.get(
            `/api/visitors/getname/${storedNIK}`
          );

          if (response.data.exists && response.data.visitor) {
            setVisitor({
              name: response.data.visitor.name,
              company: response.data.visitor.company_name,
            });
          } else {
            setError("Pengunjung tidak ditemukan");
          }
        }
      } catch (error) {
        console.error("Error fetching visitor details:", error);
        setError("Terjadi kesalahan saat mengambil detail pengunjung.");
      }
    };

    if (nik) {
      fetchVisitor();
    }
  }, [nik]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csrfRes = await axios.get("/api/csrf");
        const csrfToken = csrfRes.data.csrfToken;
        const response = await axios.get("/api/booking", {
          headers: {
            "x-csrf-token": csrfToken,
          },
        });

        setCategories(response.data.visitCategories);
        setMethods(response.data.entryMethods);

        if (Array.isArray(response.data.employees)) {
          setEmployees(response.data.employees);
        } else {
          console.error("Invalid employee data format received from server");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const filterEmployees = (inputValue: string) => {
    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const loadOptions = (inputValue: string, callback: any) => {
    setTimeout(() => {
      const filteredEmployees = filterEmployees(inputValue).map((employee) => ({
        value: employee.employee_id,
        label: employee.name,
      }));
      callback(filteredEmployees);
    }, 500);
  };

  const handleSafetyPermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError("Berkas safety permit harus kurang dari 5MB");
        setSafetyPermitFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const validExtensions = [".jpg", ".jpeg", ".png", ".heic", ".heif"];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.slice(fileName.lastIndexOf("."));
      if (!validExtensions.includes(fileExtension)) {
        setFileError("Hanya format JPG, PNG, dan HEIC/HEIF yang diperbolehkan");
        setSafetyPermitFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSafetyPermitFile(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const parsedValue = name === "employee" ? parseInt(value, 10) : value;

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleEmployeeChange = (selectedOption: any) => {
    const selectedValue = selectedOption?.value || 0;
    setFormData({ ...formData, employee: selectedValue });
  };

  const handleTeamChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "yes";
    setBringTeam(value);
    if (!value) {
      setTeamMembers([]);
      setTeamMemberCount(1);
    }
  };

  const handleTeamMemberNameChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTeamMembers = [...teamMembers];
    newTeamMembers[index] = event.target.value;
    setTeamMembers(newTeamMembers);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDateError("");

    if (!turnstileToken) {
      setError("Please complete the security verification");
      return;
    }

    if (formData.employee === 0) {
      setError("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDate = new Date(formData.entry_start_date);

    if (entryDate < today) {
      setDateError("Tanggal mulai kunjungan tidak boleh sebelum hari ini.");
      return;
    }

    if (
      formData.category === "Working__Project___Repair_" &&
      !safetyPermitFile
    ) {
      setFileError("Safety permit diperlukan untuk Working (Project & Repair)");
      return;
    }

    const isoEntryDate = new Date(formData.entry_start_date).toISOString();

    try {
      setIsSubmitting(true);
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("visitor", nik || "");
      formDataToSubmit.append("employee", formData.employee.toString());
      formDataToSubmit.append("entry_start_date", isoEntryDate);
      formDataToSubmit.append("category", formData.category);
      formDataToSubmit.append("method", formData.method);
      formDataToSubmit.append("vehicle", formData.vehicle);
      formDataToSubmit.append("brings_team", bringTeam ? "true" : "false");
      formDataToSubmit.append("token", turnstileToken);
      formDataToSubmit.append("csrfToken", csrfToken || "");

      if (bringTeam && teamMembers.length > 0) {
        formDataToSubmit.append("teammemberscount", teamMemberCount.toString());
        formDataToSubmit.append("teammembers", JSON.stringify(teamMembers));
      }

      if (safetyPermitFile) {
        formDataToSubmit.append("safety_permit", safetyPermitFile);
      }

      const response = await axios.post("/api/booking", formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.qrCodeImage) {
        router.push(
          `/visitor/showqr?qrCode=${encodeURIComponent(
            response.data.qrCodeImage
          )}`
        );
      } else {
        console.error("QR Code not received in response");
        alert(
          "Kunjungan telah dipesan, tetapi ada masalah dalam menghasilkan kode QR."
        );
      }
    } catch (error) {
      console.error("Error booking visit:", error);
      alert("Terjadi kesalahan saat melakukan pemesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabels: Record<VisitCategory, string> = {
    Meeting___Visits: "Meeting & Visits",
    Delivery: "Delivery",
    Working__Project___Repair_: "Working (Project & Repair)",
    VIP: "VIP",
  };

  const methodLabels: Record<string, string> = {
    Walking: "Walking",
    Vehicle_Roda_Dua: "Vehicle (Roda Dua)",
    Vehicle_Roda_Empat: "Vehicle (Roda Empat)",
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 pt-[calc(6rem)] pb-9">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-md w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pemesanan Kunjungan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Silakan isi detail kunjungan di bawah ini
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex mb-5 space-x-2">
            <div className="w-full">
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={visitor.name}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
                readOnly
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="company"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Perusahaan/Institusi
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={visitor.company}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
                readOnly
              />
            </div>
          </div>
          <div className="mb-5">
            <label
              htmlFor="team-members"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Apakah Anda membawa anggota tim?
            </label>
            <div className="bg-gray-50 p-2.5 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 mb-3">
              <div className="flex space-x-4 ml-1">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="bringTeam"
                    value="yes"
                    checked={bringTeam === true}
                    onChange={handleTeamChange}
                    className="w-4 h-4 accent-black border-gray-300 focus:ring-black"
                    required
                  />
                  <span className="ml-2 text-sm text-black dark:text-white">
                    Ya
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="bringTeam"
                    value="no"
                    checked={bringTeam === false}
                    onChange={handleTeamChange}
                    className="w-4 h-4 accent-black border-gray-300 focus:ring-black"
                    required
                  />
                  <span className="ml-2 text-sm text-black dark:text-white">
                    Tidak
                  </span>
                </label>
              </div>
            </div>
            {bringTeam && (
              <div>
                <label
                  htmlFor="team-member-count"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Jumlah anggota tim
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setTeamMemberCount(Math.max(1, teamMemberCount - 1))
                    }
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 rounded-l-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 w-10 flex items-center justify-center">
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="teamMemberCount"
                    value={teamMemberCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      if (value >= 1) setTeamMemberCount(value);
                    }}
                    className="bg-gray-50 border-y border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-14 p-2.5 text-center h-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={bringTeam}
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => setTeamMemberCount(teamMemberCount + 1)}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 rounded-r-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 w-10 flex items-center justify-center">
                    +
                  </button>
                </div>
                {teamMemberCount > 0 &&
                  Array.from({ length: teamMemberCount }).map((_, index) => (
                    <div key={index} className="mt-4">
                      <label
                        htmlFor={`team-member-${index}`}
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Nama Anggota Tim {index + 1}
                      </label>
                      <input
                        type="text"
                        id={`teamMember${index}`}
                        value={teamMembers[index]}
                        onChange={(e) => handleTeamMemberNameChange(index, e)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        required
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="employee"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Karyawan
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Async
              id="employee"
              name="employee"
              placeholder="Cari karyawan..."
              loadOptions={loadOptions}
              defaultOptions
              onChange={handleEmployeeChange}
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
              Ketik nama karyawan dan pilih dari daftar yang tersedia.
            </p>
          </div>
          <div className="mb-5">
            <label
              htmlFor="entry_start_date"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Tanggal Mulai Kunjungan
            </label>
            <input
              type="date"
              id="entry_start_date"
              name="entry_start_date"
              value={formData.entry_start_date}
              onChange={handleInputChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="category"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Kategori Kunjungan
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required>
              <option value="">Pilih kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="safety"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Safety Permit
              {formData.category === "Working__Project___Repair_" && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="file"
              id="safety"
              accept=".jpg,.jpeg,.png,.heic,.heif"
              ref={fileInputRef}
              onChange={handleSafetyPermitChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required={formData.category === "Working__Project___Repair_"}
              disabled={formData.category !== "Working__Project___Repair_"}
            />
            {formData.category === "Working__Project___Repair_" && (
              <p className="text-sm text-gray-500 mt-1">
                Format yang didukung: JPG, PNG, HEIC/HEIF (Maks. 5MB)
              </p>
            )}
          </div>
          <div className="flex mb-5 space-x-2">
            <div className="w-full">
              <label
                htmlFor="method"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Metode Entri
              </label>
              <select
                id="method"
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required>
                <option value="">Memilih metode entri</option>
                {methods.map((method) => (
                  <option key={method} value={method}>
                    {methodLabels[method]}
                  </option>
                ))}
              </select>
            </div>

            {(formData.method === "Vehicle_Roda_Dua" ||
              formData.method === "Vehicle_Roda_Empat") && (
              <div className="w-full">
                <label
                  htmlFor="vehicle"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Nomor Kendaraan
                </label>
                <input
                  type="text"
                  id="vehicle"
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                />
              </div>
            )}
          </div>
          <div className="flex justify-center items-center mt-8">
            <button
              type="submit"
              disabled={!turnstileToken || !csrfToken || isSubmitting}
              className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-500 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:text-black dark:bg-white dark:hover:bg-gray-100 dark:focus:ring-gray-300 disabled:opacity-70 disabled:cursor-not-allowed">
              {!turnstileToken || !csrfToken
                ? "Loading..."
                : isSubmitting
                ? "Memesan..."
                : "Pesan Kunjungan"}
            </button>
          </div>
          {dateError && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900 p-3 rounded-lg mt-5">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{dateError}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900 p-3 rounded-lg mt-5">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {fileError && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900 p-3 rounded-lg mt-5">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{fileError}</p>
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
