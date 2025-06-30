"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { X } from "lucide-react";

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
  contact_phone: string;
  contact_email: string;
  address: string;
}

interface EmployeesData {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
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
  | VisitsData;

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

  const [formData, setFormData] = useState<Partial<FormDataType>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [securityPersonnel, setSecurityPersonnel] = useState<Security[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

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
    }
  }, [isOpen, selectedTable]);

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
      name === "company_id"
    ) {
      value = parseInt(value, 10) as unknown as string;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
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
              <label htmlFor="id_number" className={labelClass}>
                ID Number
              </label>
              <input
                type="text"
                id="id_number"
                name="id_number"
                value={(formData as VisitorsData)?.id_number || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="contact_phone" className={labelClass}>
                Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={(formData as VisitorsData)?.contact_phone || ""}
                className={inputClass}
                onChange={handleChange}
                required
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
              <input
                type="tel"
                id="phone"
                name="phone"
                value={(formData as EmployeesData)?.phone || ""}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="department" className={labelClass}>
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={(formData as EmployeesData)?.department || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="position" className={labelClass}>
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={(formData as EmployeesData)?.position || ""}
                className={inputClass}
                onChange={handleChange}
                required
              />
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
