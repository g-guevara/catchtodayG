"use client"; // Necesario en App Router

import { useState } from "react";
import * as XLSX from "xlsx";

export default function DownloadAndReadExcel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [logMessages, setLogMessages] = useState([]); // 📜 Mensajes del backend en frontend

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

  const addLog = (message) => {
    setLogMessages((prevLogs) => [...prevLogs, message]);
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      setStatus("loading");
      setLogMessages(["🔍 Iniciando descarga..."]);

      const response = await fetch("/api/downloadExcel");
      const result = await response.json();

      if (!result.success) {
        setStatus("error");
        addLog("❌ Error al descargar el archivo.");
        alert("Error al descargar el archivo");
        return;
      }

      addLog("✅ Archivo descargado exitosamente. Leyendo contenido...");
      readExcel(result.fileUrl);
    } catch (error) {
      setStatus("error");
      addLog("❌ No se pudo descargar el archivo.");
      console.error("Error:", error);
      alert("No se pudo descargar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const readExcel = async (fileUrl) => {
    try {
      addLog(`📂 Cargando archivo desde: ${fileUrl}`);

      const response = await fetch(window.location.origin + fileUrl);
      if (!response.ok) throw new Error(`Error al obtener el archivo: ${response.statusText}`);

      const arrayBuffer = await response.arrayBuffer();

      addLog("📄 Procesando datos del archivo...");
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

      if (!workbook.SheetNames.length) throw new Error("No se encontraron hojas en el Excel");

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      setData(jsonData);
      setStatus("success");
      addLog("✅ Datos cargados exitosamente.");
      console.log("📊 Datos leídos del Excel:", jsonData);
    } catch (error) {
      setStatus("error");
      addLog("❌ Error al leer el archivo.");
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

      {/* 🔹 Mostrar logs del proceso */}
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #ddd",
          borderRadius: "5px",
          textAlign: "left",
          width: "60%",
          margin: "20px auto",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Estado del Proceso:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {logMessages.map((msg, index) => (
            <li key={index} style={{ fontSize: "14px", marginBottom: "5px" }}>
              {msg}
            </li>
          ))}
        </ul>
      </div>

      {/* 🔹 Mostrar los datos extraídos del Excel */}
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
