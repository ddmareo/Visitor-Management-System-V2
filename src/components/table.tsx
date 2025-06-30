"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Eye,
  Edit,
  Upload,
  Download,
  Plus,
  Trash2,
  File,
  QrCode,
} from "lucide-react";
import axios from "axios";
import AddForm from "./addform";
import EditForm from "./editform";
import CSVPreviewModal from "@/components/csv-preview";
import QRCodeModal from "@/components/qrcode-preview";

interface Visitor {
  visitor_id: string;
  name: string;
  company_name: string;
  id_number: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  registration_date: string;
}

interface Company {
  company_id: string;
  company_name: string;
}

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
}

interface Security {
  security_id: string;
  security_name: string;
}

interface Users {
  user_id: string;
  username: string;
  password: string;
  role: "admin" | "user" | "security" | "sec_admin";
  employee_name?: string | null;
  security_name?: string | null;
}

interface Visit {
  visit_id: string;
  visitor_name?: string;
  employee_name?: string;
  security_name?: string;
  visit_category: string;
  entry_start_date: string;
  entry_method: string;
  vehicle_number?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  verification_status: boolean;
  safety_permit?: string | null;
  brings_team: boolean;
  team_members_quantity?: number | null;
}

interface TeamMember {
  team_member_id: string;
  visit_id: string;
  member_name: string;
}

type FormDataType =
  | Visitor
  | Company
  | Employee
  | Security
  | Users
  | Visit
  | TeamMember;

const Table = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState("visitorsdata");
  const [tableData, setTableData] = useState<
    | Visitor[]
    | Company[]
    | Employee[]
    | Security[]
    | Users[]
    | Visit[]
    | TeamMember[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [csvPreviewData, setCSVPreviewData] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeImage, setQRCodeImage] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { data: session } = useSession();

  const downloadTemplate = () => {
    const templateData = `name,email,phone,department,position
    John Doe,john@example.com,+1234567890,IT,Software Engineer
    Jane Smith,jane@example.com,+0987654321,HR,Manager`;

    const blob = new Blob([templateData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadCompanyTemplate = () => {
    const templateData = `company_name
  Example Company
  Another Company`;

    const blob = new Blob([templateData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "company_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/table/${selectedTable}`);
        if (selectedTable === "usersdata") {
          setTableData(data.users);
        } else if (selectedTable === "visitorsdata") {
          setTableData(data.visitors);
        } else {
          setTableData(data);
        }

        const hideAddButtonTables = [
          "visitorsdata",
          "visitsdata",
          "teammembersdata",
        ];
        setIsVisible(!hideAddButtonTables.includes(selectedTable));
      } catch (error) {
        console.error("Error fetching table data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTable]);

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setSearchTerm("");

    const hideAddButtonTables = [
      "visitorsdata",
      "visitsdata",
      "teammembersdata",
    ];
    setIsVisible(!hideAddButtonTables.includes(tableName));
  };

  const TabButton = ({
    tableName,
    label,
    show = true,
  }: {
    tableName: string;
    label: string;
    show?: boolean;
  }) => {
    if (!show) return null;

    return (
      <button
        onClick={() => handleTableChange(tableName)}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
          selectedTable === tableName
            ? "text-blue-600 bg-white border-t border-x border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            : "text-gray-500 hover:text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        }`}>
        {label}
      </button>
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);

    if (checked) {
      const allIds = filterData().map((item: any) => {
        switch (selectedTable) {
          case "visitorsdata":
            return (item as Visitor).visitor_id;
          case "employeesdata":
            return (item as Employee).employee_id;
          case "securitydata":
            return (item as Security).security_id;
          case "usersdata":
            return (item as Users).user_id;
          case "visitsdata":
            return (item as Visit).visit_id;
          case "teammembersdata":
            return (item as TeamMember).team_member_id;
          case "companydata":
            return (item as Company).company_id;
          default:
            return "";
        }
      });
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (selectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);

    setSelectAll(newSelectedItems.size === filterData().length);
  };

  const openIdCard = async (visitorId: string) => {
    try {
      const response = await axios.get(
        `/api/table/visitorsdata/idcard/${visitorId}`,
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
      }
    } catch (error) {
      console.error("Error fetching ID card:", error);
      alert("Failed to load ID Card image");
    }
  };

  const openSafetyPermit = async (visitId: string) => {
    try {
      const response = await axios.get(
        `/api/table/visitsdata/safety/${visitId}`,
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

  const openQRCode = async (visitId: string) => {
    try {
      const response = await axios.get(
        `/api/table/visitsdata/qrcode/${visitId}`
      );
      setQRCodeImage(response.data.qrCodeImage);
      setShowQRModal(true);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      alert("Failed to load QR Code");
    }
  };

  const handleSubmit = async (formData: FormDataType) => {
    try {
      await axios.post(`/api/table/${selectedTable}`, formData);
      const { data } = await axios.get(`/api/table/${selectedTable}`);
      if (selectedTable === "usersdata") {
        setTableData(data.users);
      } else {
        setTableData(data);
      }
    } catch (error) {
      console.error("Error adding new item:", error);
      alert("Failed to add new item");
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      alert("Select at least one of the checkboxes!");
      return;
    }

    if (!confirm("Are you sure you want to delete the selected items?")) return;

    try {
      await axios.delete(`/api/table/${selectedTable}`, {
        data: {
          ids: Array.from(selectedItems),
        },
      });

      const { data } = await axios.get(`/api/table/${selectedTable}`);
      if (selectedTable === "usersdata") {
        setTableData(data.users);
      } else if (selectedTable === "visitorsdata") {
        setTableData(data.visitors);
      } else {
        setTableData(data);
      }
      setSelectedItems(new Set());
      setSelectAll(false);
    } catch (error: any) {
      console.error("Error deleting items", error);
      if (error.response?.data?.error === "COMPANY_HAS_VISITORS") {
        alert(
          "Cannot delete companies that have associated visitors. Please delete or reassign the visitors first."
        );
      } else {
        alert("Failed to delete items");
      }
    }
  };

  const handleAdd = () => {
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCSVFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      alert("Please upload a CSV file");
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const rows = text.split("\n");
      const headers = rows[0].split(",");

      const data = rows
        .slice(1)
        .map((row) => {
          const values = row.split(",");
          return headers.reduce((obj: any, header, index) => {
            obj[header.trim()] = values[index]?.trim() || "";
            return obj;
          }, {});
        })
        .filter((row) => Object.values(row).some((value) => value));

      setCSVPreviewData(data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error reading CSV file:", error);
      alert("Error reading CSV file");
    }
  };

  const handleCompanyCSVFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      alert("Please upload a CSV file");
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const rows = text.split("\n");
      const headers = rows[0].split(",");

      const data = rows
        .slice(1)
        .map((row) => {
          const values = row.split(",");
          return headers.reduce((obj: any, header, index) => {
            obj[header.trim()] = values[index]?.trim() || "";
            return obj;
          }, {});
        })
        .filter((row) => Object.values(row).some((value) => value));

      setCSVPreviewData(data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error reading CSV file:", error);
      alert("Error reading CSV file");
    }
  };

  const handleCSVImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setShowPreviewModal(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      let endpoint = "";
      if (selectedTable === "employeesdata") {
        endpoint = "/api/table/employeesdata/import";
      } else if (selectedTable === "companydata") {
        endpoint = "/api/table/companydata/import";
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { data } = await axios.get(`/api/table/${selectedTable}`);
      setTableData(data);

      const entityType =
        selectedTable === "employeesdata" ? "employees" : "companies";
      alert(`Successfully imported ${response.data.imported} ${entityType}`);
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      alert(error.response?.data?.message || "Failed to import CSV file");
    } finally {
      setImporting(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleExportCSV = () => {
    if (selectedTable === "employeesdata") {
      const employees = tableData as Employee[];

      const headers = ["name,email,phone,department,position"];

      const csvRows = employees.map((employee) => {
        return [
          employee.name,
          employee.email,
          employee.phone || "",
          employee.department,
          employee.position,
        ]
          .map((field) => `${field}`)
          .join(",");
      });

      const csvContent = [headers, ...csvRows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "employees.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleExportCompanyCSV = () => {
    const companies = tableData as Company[];
    const headers = ["company_name"];

    const csvRows = companies.map((company) => {
      const escapedCompanyName = `"${company.company_name.replace(
        /"/g,
        '""'
      )}"`;
      return escapedCompanyName;
    });

    const csvContent = [headers, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "companies.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      let id;
      switch (selectedTable) {
        case "visitorsdata":
          id = selectedItem.visitor_id;
          break;
        case "employeesdata":
          id = selectedItem.employee_id;
          break;
        case "securitydata":
          id = selectedItem.security_id;
          break;
        case "usersdata":
          id = selectedItem.user_id;
          break;
        case "visitsdata":
          id = selectedItem.visit_id;
          break;
        case "teammembersdata":
          id = selectedItem.team_member_id;
          break;
        case "companydata":
          id = selectedItem.company_id;
          break;
        default:
          throw new Error("Invalid table selected");
      }

      await axios.put(`/api/table/${selectedTable}/${id}`, formData);
      const { data } = await axios.get(`/api/table/${selectedTable}`);
      if (selectedTable === "usersdata") {
        setTableData(data.users);
      } else if (selectedTable === "visitorsdata") {
        setTableData(data.visitors);
      } else {
        setTableData(data);
      }
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
    }
  };

  const filterData = () => {
    if (!searchTerm && !startDate && !endDate) return tableData;

    const searchLower = searchTerm.toLowerCase();
    let filteredResults = tableData;

    // Date range filter for visits table
    if (selectedTable === "visitsdata" && (startDate || endDate)) {
      filteredResults = (filteredResults as Visit[]).filter((visit) => {
        const visitDate = new Date(visit.entry_start_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return visitDate >= start && visitDate <= end;
        } else if (start) {
          return visitDate >= start;
        } else if (end) {
          return visitDate <= end;
        }
        return true;
      });
    }

    if (!searchTerm) return filteredResults;

    switch (selectedTable) {
      case "visitorsdata":
        return (filteredResults as Visitor[]).filter((visitor) =>
          Object.values(visitor).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "companydata":
        return (filteredResults as Company[]).filter((company) =>
          Object.values(company).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "employeesdata":
        return (filteredResults as Employee[]).filter((employee) =>
          Object.values(employee).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "securitydata":
        return (filteredResults as Security[]).filter((security) =>
          Object.values(security).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "usersdata":
        return (filteredResults as Users[]).filter((user) =>
          Object.values(user)
            .filter((value) => value !== "password")
            .some(
              (value) =>
                value && value.toString().toLowerCase().includes(searchLower)
            )
        );

      case "visitsdata":
        return (filteredResults as Visit[]).filter((visit) =>
          Object.values(visit).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "teammembersdata":
        return (filteredResults as TeamMember[]).filter((member) =>
          Object.values(member).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      default:
        return filteredResults;
    }
  };

  const renderDateRangePicker = () => {
    if (selectedTable !== "visitsdata") return null;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <span className="text-gray-500">to</span>
        <div className="flex items-center">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm text-red-600 hover:text-red-800">
            Clear
          </button>
        )}
      </div>
    );
  };

  const renderTableHeaders = () => {
    const commonCheckbox = (
      <th scope="col" className="p-4">
        <div className="flex items-center">
          <input
            id="checkbox-all-search"
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="checkbox-all-search" className="sr-only">
            checkbox
          </label>
        </div>
      </th>
    );
    switch (selectedTable) {
      case "visitorsdata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Company
            </th>
            <th scope="col" className="px-6 py-3">
              ID Number
            </th>
            <th scope="col" className="px-6 py-3">
              Phone
            </th>
            <th scope="col" className="px-6 py-3">
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Address
            </th>
            <th scope="col" className="px-6 py-3">
              Registration Date
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "employeesdata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Phone
            </th>
            <th scope="col" className="px-6 py-3">
              Department
            </th>
            <th scope="col" className="px-6 py-3">
              Position
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "securitydata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              Security ID
            </th>
            <th scope="col" className="px-6 py-3">
              Security Name
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "companydata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              Company ID
            </th>
            <th scope="col" className="px-6 py-3">
              Company Name
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "usersdata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              Username
            </th>
            <th scope="col" className="px-6 py-3">
              Password
            </th>
            <th scope="col" className="px-6 py-3">
              Role
            </th>
            <th scope="col" className="px-6 py-3">
              Employee
            </th>
            <th scope="col" className="px-6 py-3">
              Security
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "visitsdata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              ID
            </th>
            <th scope="col" className="px-6 py-3">
              Visitor
            </th>
            <th scope="col" className="px-6 py-3">
              Employee
            </th>
            <th scope="col" className="px-6 py-3">
              Security
            </th>
            <th scope="col" className="px-6 py-3">
              Visit Category
            </th>
            <th scope="col" className="px-6 py-3">
              Entry Start Date
            </th>
            <th scope="col" className="px-6 py-3">
              Entry Method
            </th>
            <th scope="col" className="px-6 py-3">
              Vehicle Number
            </th>
            <th scope="col" className="px-6 py-3">
              Check-in
            </th>
            <th scope="col" className="px-6 py-3">
              Check-out
            </th>
            <th scope="col" className="px-6 py-3">
              Verification Status
            </th>
            <th scope="col" className="px-6 py-3">
              Brings Team
            </th>
            <th scope="col" className="px-6 py-3">
              Team Members Quantity
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "teammembersdata":
        return (
          <tr>
            {commonCheckbox}
            <th scope="col" className="px-6 py-3">
              Team Member ID
            </th>
            <th scope="col" className="px-6 py-3">
              Visit ID
            </th>
            <th scope="col" className="px-6 py-3">
              Member Name
            </th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    const filteredData = filterData();
    const commonRowCheckbox = (id: string) => (
      <td className="w-4 p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedItems.has(id)}
            onChange={() => handleSelectItem(id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label className="sr-only">checkbox</label>
        </div>
      </td>
    );

    const actionLogo = (item: any) => (
      <td className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <a
            onClick={() => handleEdit(item)}
            className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
            <Edit className="w-5 h-5" />
          </a>
          {selectedTable === "visitorsdata" && (
            <a
              onClick={() => openIdCard(item.visitor_id)}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              <Eye className="w-5 h-5" />
            </a>
          )}
          {selectedTable === "visitsdata" && (
            <>
              {item.visit_category === "Working (Project & Repair)" && (
                <a
                  onClick={() => openSafetyPermit(item.visit_id)}
                  className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
                  <Eye className="w-5 h-5" />
                </a>
              )}
              <a
                onClick={() => openQRCode(item.visit_id)}
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
                <QrCode className="w-5 h-5" />
              </a>
            </>
          )}
        </div>
      </td>
    );

    if (selectedTable === "visitorsdata") {
      return (filteredData as Visitor[]).map((visitor) => (
        <tr
          key={visitor.visitor_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(visitor.visitor_id)}
          <td className="px-6 py-4">{visitor.name}</td>
          <td className="px-6 py-4">{visitor.company_name}</td>
          <td className="px-6 py-4">{visitor.id_number}</td>
          <td className="px-6 py-4">{visitor.contact_phone}</td>
          <td className="px-6 py-4">{visitor.contact_email}</td>
          <td className="px-6 py-4">{visitor.address}</td>
          <td className="px-6 py-4">
            {new Date(visitor.registration_date).toLocaleDateString("en-GB")}
          </td>
          {actionLogo(visitor)}
        </tr>
      ));
    } else if (selectedTable === "employeesdata") {
      return (filteredData as Employee[]).map((employee) => (
        <tr
          key={employee.employee_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(employee.employee_id)}
          <td className="px-6 py-4">{employee.name}</td>
          <td className="px-6 py-4">{employee.email}</td>
          <td className="px-6 py-4">{employee.phone}</td>
          <td className="px-6 py-4">{employee.department}</td>
          <td className="px-6 py-4">{employee.position}</td>
          {actionLogo(employee)}
        </tr>
      ));
    } else if (selectedTable === "securitydata") {
      return (filteredData as Security[]).map((security) => (
        <tr
          key={security.security_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(security.security_id)}
          <td className="px-6 py-4">{security.security_id}</td>
          <td className="px-6 py-4">{security.security_name}</td>
          {actionLogo(security)}
        </tr>
      ));
    } else if (selectedTable === "usersdata") {
      return (filteredData as Users[]).map((user) => (
        <tr key={user.user_id} className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(user.user_id)}
          <td className="px-6 py-4">{user.username}</td>
          <td className="px-6 py-4">{user.password}</td>
          <td className="px-6 py-4">{user.role}</td>
          <td className="px-6 py-4">{user.employee_name}</td>
          <td className="px-6 py-4">{user.security_name}</td>
          {actionLogo(user)}
        </tr>
      ));
    } else if (selectedTable === "visitsdata") {
      return (filteredData as Visit[]).map((visit) => (
        <tr key={visit.visit_id} className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(visit.visit_id)}
          <td className="px-6 py-4">{visit.visit_id}</td>
          <td className="px-6 py-4">{visit.visitor_name}</td>
          <td className="px-6 py-4">{visit.employee_name}</td>
          <td className="px-6 py-4">{visit.security_name}</td>
          <td className="px-6 py-4">{visit.visit_category}</td>
          <td className="px-6 py-4">
            {new Date(visit.entry_start_date).toLocaleDateString("en-GB")}
          </td>
          <td className="px-6 py-4">{methodLabels[visit.entry_method]}</td>
          <td className="px-6 py-4">{visit.vehicle_number}</td>
          <td className="px-6 py-4">
            {visit.check_in_time
              ? new Date(visit.check_in_time).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })
              : "-"}
          </td>
          <td className="px-6 py-4">
            {visit.check_out_time
              ? new Date(visit.check_out_time).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })
              : "-"}
          </td>
          <td className="px-6 py-4">
            {visit.verification_status ? "Verified" : "Not Verified"}
          </td>
          <td className="px-6 py-4">{visit.brings_team ? "Yes" : "No"}</td>
          <td className="px-6 py-4">{visit.team_members_quantity}</td>
          {actionLogo(visit)}
        </tr>
      ));
    } else if (selectedTable === "teammembersdata") {
      return (filteredData as TeamMember[]).map((teamMember) => (
        <tr
          key={teamMember.team_member_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(teamMember.team_member_id)}
          <td className="px-6 py-4">{teamMember.team_member_id}</td>
          <td className="px-6 py-4">{teamMember.visit_id}</td>
          <td className="px-6 py-4">{teamMember.member_name}</td>
        </tr>
      ));
    } else if (selectedTable === "companydata") {
      return (filteredData as Company[]).map((company) => (
        <tr
          key={company.company_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(company.company_id)}
          <td className="px-6 py-4">{company.company_id}</td>
          <td className="px-6 py-4">{company.company_name}</td>
          {actionLogo(company)}
        </tr>
      ));
    } else {
      return null;
    }
  };

  const methodLabels: Record<string, string> = {
    Walking: "Walking",
    Vehicle_Roda_Dua: "Vehicle (Roda Dua)",
    Vehicle_Roda_Empat: "Vehicle (Roda Empat)",
  };

  return (
    <div>
      <div className="flex flex-col space-y-4 pb-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto">
            <TabButton tableName="visitorsdata" label="Visitors" />
            <TabButton tableName="companydata" label="Companies" />
            <TabButton tableName="employeesdata" label="Employees" />
            <TabButton tableName="securitydata" label="Security" />
            <TabButton
              tableName="usersdata"
              label="Users"
              show={session?.user?.role === "admin"}
            />
            <TabButton tableName="visitsdata" label="Visits" />
            <TabButton tableName="teammembersdata" label="Team Members" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
          <div className="flex items-center space-x-1.5">
            {isVisible && (
              <button
                onClick={handleAdd}
                className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2">
                <Plus className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2">
              <Trash2 className="w-5 h-5" />
            </button>
            {selectedTable === "employeesdata" && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCSVFileSelect}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={triggerFileInput}
                  disabled={importing}
                  className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                  <Upload className="w-5 h-5 mr-1" />
                  {importing ? "Importing..." : "Import CSV"}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                  <File className="w-5 h-5 mr-1" />
                  Export CSV
                </button>
                <button
                  onClick={downloadTemplate}
                  className="text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                  <Download className="w-5 h-5 mr-1" />
                  Template
                </button>
              </>
            )}
            {selectedTable === "companydata" && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCompanyCSVFileSelect}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={triggerFileInput}
                  disabled={importing}
                  className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                  <Upload className="w-5 h-5 mr-1" />
                  {importing ? "Importing..." : "Import CSV"}
                </button>
                <button
                  onClick={handleExportCompanyCSV}
                  className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                  <File className="w-5 h-5 mr-1" />
                  Export CSV
                </button>
                <button
                  onClick={downloadCompanyTemplate}
                  className="text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-4 py-2 flex items-center">
                  <Download className="w-5 h-5 mr-1" />
                  Template
                </button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {renderDateRangePicker()}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                className="block p-2 ps-10 text-sm text-gray-900 dark:text-white border border-gray-300 rounded-lg w-75 bg-gray-50 dark:bg-gray-900"
                placeholder="Search for items"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-300">
            <thead className="text-xs text-gray-700 dark:text-white uppercase bg-gray-50 dark:bg-gray-700">
              {renderTableHeaders()}
            </thead>
            <tbody>{renderTableRows()}</tbody>
          </table>
        )}
      </div>
      <CSVPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        data={csvPreviewData}
        onConfirm={handleCSVImport}
      />
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCodeImage={qrCodeImage}
      />
      <AddForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTable={selectedTable}
        onSubmit={handleSubmit}
      />
      <EditForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        selectedTable={selectedTable}
        initialData={selectedItem}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default Table;
