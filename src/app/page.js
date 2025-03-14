"use client"; // Necesario en App Router

import { useState } from "react";
import * as XLSX from "xlsx";

export default function DownloadAndReadExcel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const getButtonColor = () => {
    switch (status) {
      case "idle":
        return "#007BFF"; // Azul
      case "loading":
        return "#6C757D"; // Gris
      case "success":
        return "#28A745"; // Verde
      case "error":
        return "#DC3545"; // Rojo
      default:
        return "#007BFF";
    }
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      setStatus("loading");

      const response = await fetch("/api/downloadExcel");
      const result = await response.json();

      if (!result.success) {
        setStatus("error");
        alert("Error al descargar el archivo");
        return;
      }

      // Leer el archivo Excel descargado
      readExcel(result.fileUrl);
    } catch (error) {
      setStatus("error");
      console.error("Error:", error);
      alert("No se pudo descargar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const readExcel = async (fileUrl) => {
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      setData(jsonData);
      setStatus("success");
      console.log("📊 Datos leídos del Excel:", jsonData);
    } catch (error) {
      setStatus("error");
      console.error("Error al leer el archivo:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <button
        onClick={downloadExcel}
        disabled={loading}
        style={{
          backgroundColor: getButtonColor(),
          color: "white",
          padding: "10px 20px",
          fontSize: "16px",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.3s",
        }}
      >
        {loading ? "Descargando..." : "Descargar y leer Excel"}
      </button>

      {data.length > 0 && (
        <table border="1" style={{ margin: "20px auto", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key} style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((cell, i) => (
                  <td key={i} style={{ padding: "10px", border: "1px solid #ddd" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
