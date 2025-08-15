"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { X } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import ReactCountryFlag from "react-country-flag";
import { passportLocales } from "@/utils/validation";

interface EditFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  initialData: any;
  onSubmit: (data: any) => void;
}

interface VisitorsData {
  name: string;
  company_id: string;
  id_number: string;
  country: string;
  contact_phone: string;
  contact_email: string;
  address: string;
}

interface PositionData {
  position_id: number;
  name: string;
  department_id: number;
}

interface DepartmentData {
  department_id: number;
  name: string;
}

interface EmployeesData {
  name: string;
  email: string;
  phone: string;
  department_id: string;
  position_id: string;
}

interface SecurityData {
  security_name: string;
}

interface CompanyData {
  company_name: string;
}

interface UsersData {
  username: string;
  password: string;
  role: string;
  employee_id: string | null;
  security_id: string | null;
}

interface VisitsData {
  visit_category: string;
  entry_start_date: string;
  entry_method: string;
  vehicle_number?: string;
}

type FormDataType =
  | VisitorsData
  | EmployeesData
  | SecurityData
  | UsersData
  | CompanyData
  | VisitsData
  | PositionData
  | DepartmentData;

const EditForm: React.FC<EditFormProps> = ({
  isOpen,
  onClose,
  selectedTable,
  initialData,
  onSubmit,
}) => {
  type Employee = {
    employee_id: number;
    name: string;
  };

  type Security = {
    security_id: number;
    security_name: string;
  };

  type Company = {
    company_id: number;
    company_name: string;
  };

  type Department = {
    department_id: number;
    name: string;
  };

  const [formData, setFormData] = useState<Partial<FormDataType>>({});
  const [visitorMode, setVisitorMode] = useState<"WNI" | "WNA">("WNI");
  const [country, setCountry] = useState("ID");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [securityPersonnel, setSecurityPersonnel] = useState<Security[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<PositionData[]>(
    []
  );

  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const formatDateForSubmission = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (error) {
      console.error("Error formatting date for submission:", error);
      return "";
    }
  };

  useEffect(() => {
    if (isOpen && initialData) {
      if (selectedTable === "visitsdata") {
        const visits = initialData as VisitsData;
        setFormData({
          ...initialData,
          entry_start_date: formatDateForInput(visits.entry_start_date),
        });
      } else if (selectedTable === "positionsdata") {
        const position = initialData as PositionData;
        setFormData({
          ...initialData,
          department_id: position.department_id || "",
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, initialData, selectedTable]);

  useEffect(() => {
    if (isOpen && selectedTable === "usersdata") {
      fetchEmployees();
      fetchSecurityPersonnel();
    } else if (isOpen && selectedTable === "visitorsdata") {
      fetchCompanies();
    } else if (isOpen && selectedTable === "positionsdata") {
      fetchDepartments();
    } else if (isOpen && selectedTable === "employeesdata") {
      fetchDepartments();
      fetchAllPositions();
    }
  }, [isOpen, selectedTable]);

  useEffect(() => {
    if (selectedTable === "employeesdata" && formData) {
      const employeeData = formData as EmployeesData;
      if (employeeData.department_id) {
        const filtered = positions.filter(
          (position) =>
            position.department_id === parseInt(employeeData.department_id, 10)
        );
        setFilteredPositions(filtered);
      } else {
        setFilteredPositions([]);
      }
    }
  }, [(formData as EmployeesData)?.department_id, positions, selectedTable]);

  useEffect(() => {
    if (isOpen && initialData && selectedTable === "visitorsdata") {
      const visitorData = initialData as VisitorsData;

      // Determine mode based on existing country data
      if (visitorData.country === "ID" || !visitorData.country) {
        setVisitorMode("WNI");
        setCountry("ID");
      } else {
        setVisitorMode("WNA");
        setCountry(visitorData.country || "US");
      }

      setFormData({
        ...initialData,
      });
    }
  }, [isOpen, initialData, selectedTable]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`/api/table/usersdata`);
      if (response.data.employees) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAllPositions = async () => {
    try {
      const response = await axios.get("/api/table/employeesdata");
      if (response.data.positions) {
        setPositions(response.data.positions);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchSecurityPersonnel = async () => {
    try {
      const response = await axios.get("/api/table/usersdata");
      if (response.data.security) setSecurityPersonnel(response.data.security);
    } catch (error) {
      console.error("Error fetching security personnel:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get("/api/table/visitorsdata");
      if (response.data.company) {
        setCompanies(response.data.company);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/table/positionsdata");
      if (response.data.department) {
        setDepartments(response.data.department);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleModeToggle = (newMode: "WNI" | "WNA") => {
    setVisitorMode(newMode);

    if (newMode === "WNI") {
      setCountry("ID");
      // Reset to original NIK value from initialData
      const originalNik = (initialData as VisitorsData)?.id_number || "";
      setFormData((prev) => ({
        ...prev,
        country: "ID",
        id_number: originalNik,
      }));
    } else {
      // Set default country for WNA based on current country or US
      const defaultCountry = country === "ID" ? "US" : country;
      setCountry(defaultCountry);
      setFormData((prev) => ({
        ...prev,
        country: defaultCountry,
        id_number: "", // Clear passport field when switching to WNA
      }));
    }
  };

  const handleChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    if ((name === "employee_id" || name === "security_id") && value === "") {
      value = null as unknown as string;
    } else if (
      name === "employee_id" ||
      name === "security_id" ||
      name === "company_id" ||
      name === "department_id" ||
      name === "position_id"
    ) {
      value = parseInt(value, 10) as unknown as string;
    }

    // If department changes, reset position
    if (name === "department_id" && selectedTable === "employeesdata") {
      setFormData({
        ...formData,
        [name]: value,
        position_id: "", // Reset position when department changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedTable === "visitsdata") {
      const visitsData = formData as Partial<VisitsData>;
      const submissionData = {
        ...formData,
        entry_start_date: formatDateForSubmission(visitsData.entry_start_date),
      };
      onSubmit(submissionData);
    } else {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  const renderForm = () => {
    const inputClass =
      "w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white";
    const labelClass =
      "block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100";

    switch (selectedTable) {
      case "visitorsdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={(formData as VisitorsData)?.name || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="company_id" className={labelClass}>
                Company
              </label>
              <select
                id="company_id"
                name="company_id"
                value={(formData as VisitorsData)?.company_id || ""}
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className={labelClass}>ID Type</label>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      visitorMode === "WNI"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                    NIK (WNI)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleModeToggle(visitorMode === "WNI" ? "WNA" : "WNI")
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      visitorMode === "WNA"
                        ? "bg-indigo-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        visitorMode === "WNA"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      visitorMode === "WNA"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                    Passport (WNA)
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {visitorMode === "WNA" && (
                  <div className="flex items-center gap-2 px-3 py-3 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600">
                    <ReactCountryFlag
                      countryCode={country}
                      svg
                      style={{
                        width: "1.5em",
                        height: "1.5em",
                      }}
                      title={country}
                    />
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        setCountry(newCountry);
                        setFormData((prev) => ({
                          ...prev,
                          country: newCountry,
                        }));
                      }}
                      className="bg-transparent outline-none text-sm font-medium text-gray-900 dark:text-white border-none p-0 m-0 cursor-pointer">
                      {passportLocales.map((locale: string) => (
                        <option
                          key={locale}
                          value={locale}
                          className="dark:text-gray-900">
                          {locale}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="relative group flex-1">
                  <input
                    type="text"
                    id="id_number"
                    name="id_number"
                    value={(formData as VisitorsData)?.id_number || ""}
                    onChange={handleChange}
                    placeholder={
                      visitorMode === "WNI" ? "XXXX XXXX XXXX XXXX" : "A1B2C3D4"
                    }
                    className="w-full px-4 py-3 text-black tracking-wider border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 ease-in-out font-medium 
                    dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400"
                    maxLength={visitorMode === "WNI" ? 16 : 12}
                    required
                  />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 dark:group-hover:border-indigo-400 rounded-lg pointer-events-none transition-all duration-200 ease-in-out"></div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="contact_phone" className={labelClass}>
                Phone
              </label>
              <PhoneInput
                name="contact_phone"
                value={(formData as VisitorsData)?.contact_phone || undefined}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    contact_phone: value || "",
                  }));
                }}
                defaultCountry="ID"
                countryCallingCodeEditable={false}
                className="w-full"
                international
              />
            </div>
            <div className="mb-4">
              <label htmlFor="contact_email" className={labelClass}>
                Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={(formData as VisitorsData)?.contact_email || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address" className={labelClass}>
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={(formData as VisitorsData)?.address || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
          </>
        );

      case "employeesdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={(formData as EmployeesData)?.name || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={(formData as EmployeesData)?.email || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <PhoneInput
                name="phone"
                value={(formData as EmployeesData)?.phone || undefined}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, phone: value || "" }));
                }}
                defaultCountry="ID"
                countryCallingCodeEditable={false}
                className="w-full"
                international
              />
            </div>
            <div className="mb-4">
              <label htmlFor="department_id" className={labelClass}>
                Department
              </label>
              <select
                id="department_id"
                name="department_id"
                value={(formData as EmployeesData)?.department_id || ""}
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option
                    key={department.department_id}
                    value={department.department_id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="position_id" className={labelClass}>
                Position
              </label>
              <select
                id="position_id"
                name="position_id"
                value={(formData as EmployeesData)?.position_id || ""}
                className={inputClass}
                onChange={handleChange}
                required
                disabled={!(formData as EmployeesData)?.department_id}>
                <option value="">
                  {(formData as EmployeesData)?.department_id
                    ? "Select position"
                    : "Select department first"}
                </option>
                {filteredPositions.map((position) => (
                  <option
                    key={position.position_id}
                    value={position.position_id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case "securitydata":
        return (
          <div className="mb-4">
            <label htmlFor="security_name" className={labelClass}>
              Security Name
            </label>
            <input
              type="text"
              id="security_name"
              name="security_name"
              value={(formData as SecurityData)?.security_name || ""}
              className={inputClass}
              onChange={handleChange}
              required
            />
          </div>
        );

      case "companydata":
        return (
          <div className="mb-4">
            <label htmlFor="company_name" className={labelClass}>
              Company Name
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={(formData as CompanyData)?.company_name || ""}
              className={inputClass}
              onChange={handleChange}
              required
            />
          </div>
        );

      case "departmentsdata":
        return (
          <div className="mb-4">
            <label htmlFor="name" className={labelClass}>
              Department Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={(formData as DepartmentData)?.name || ""}
              className={inputClass}
              onChange={handleChange}
              required
            />
          </div>
        );

      case "positionsdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>
                Position Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={(formData as PositionData)?.name || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="department_id" className={labelClass}>
                Department
              </label>
              <select
                id="department_id"
                name="department_id"
                value={(formData as PositionData)?.department_id || ""}
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option
                    key={department.department_id}
                    value={department.department_id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case "usersdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={(formData as UsersData)?.username || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={(formData as UsersData)?.password || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <select
                id="role"
                name="role"
                value={(formData as UsersData)?.role || ""}
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="sec_admin">Sec Admin</option>
                <option value="user">User</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="employee_id" className={labelClass}>
                Employee
              </label>
              <select
                id="employee_id"
                name="employee_id"
                value={(formData as UsersData)?.employee_id || ""}
                className={inputClass}
                onChange={handleChange}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="security_id" className={labelClass}>
                Security
              </label>
              <select
                id="security_id"
                name="security_id"
                value={(formData as UsersData)?.security_id || ""}
                className={inputClass}
                onChange={handleChange}>
                <option value="">Select security</option>
                {securityPersonnel.map((security) => (
                  <option
                    key={security.security_id}
                    value={security.security_id}>
                    {security.security_name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case "visitsdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="visit_category" className={labelClass}>
                Visit Category
              </label>
              <select
                id="visit_category"
                name="visit_category"
                value={(formData as VisitsData)?.visit_category || ""}
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select category</option>
                <option value="Meeting & Visits">Meeting & Visits</option>
                <option value="Delivery">Delivery</option>
                <option value="Working (Project & Repair)">
                  Working (Project & Repair)
                </option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="entry_start_date" className={labelClass}>
                Entry Start Date
              </label>
              <input
                type="date"
                id="entry_start_date"
                name="entry_start_date"
                value={(formData as VisitsData)?.entry_start_date || ""}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="entry_method" className={labelClass}>
                Entry Method
              </label>
              <select
                id="entry_method"
                name="entry_method"
                value={(formData as VisitsData)?.entry_method || ""}
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select method</option>
                <option value="Walking">Walking</option>
                <option value="Vehicle_Roda_Dua">Vehicle (Roda Dua)</option>
                <option value="Vehicle_Roda_Empat">Vehicle (Roda Empat)</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="vehicle_number" className={labelClass}>
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicle_number"
                name="vehicle_number"
                value={(formData as VisitsData)?.vehicle_number || ""}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit{" "}
            {selectedTable.replace("data", "").charAt(0).toUpperCase() +
              selectedTable.replace("data", "").slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {renderForm()}
          <div className="flex justify-end gap-2 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-blue-600 rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditForm;
