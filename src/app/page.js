"use client"; // Necesario en App Router

import { useState } from "react";

export default function DownloadAndReadExcel() {
  const [data, setData] = useState([]); // 📊 Datos obtenidos del API
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [logMessages, setLogMessages] = useState([]); // 📜 Logs del proceso

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


// Ajusta fetchData en tu componente Downlo
// Componente React actualizado
const fetchData = async () => {
  try {
    setLoading(true);
    setStatus("loading");
    setLogMessages(["🔍 Iniciando obtención de datos..."]);
    
    addLog("⏳ Esto puede tomar un momento, se están recopilando datos de 53 páginas...");

    const response = await fetch("/api/downloadExcel");
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const result = await response.json();

    if (!result.success) {
      setStatus("error");
      addLog(`❌ Error: ${result.message || "Error al obtener los datos"}`);
      alert("Error al obtener los datos.");
      return;
    }

    addLog(`✅ Datos obtenidos exitosamente. ${result.totalEventos} eventos encontrados.`);
    setData(result.eventos);
    setStatus("success");
  } catch (error) {
    setStatus("error");
    addLog(`❌ Error: ${error.message}`);
    console.error("Error:", error);
    alert("No se pudieron obtener los datos: " + error.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <button
        onClick={fetchData}
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
        {loading ? "Cargando..." : "Obtener datos"}
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

      {/* 🔹 Mostrar los datos obtenidos */}
      {data.length > 0 && (
        <table border="1" style={{ margin: "20px auto", borderCollapse: "collapse", width: "80%" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>Tipo</th>
              <th style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>Evento</th>
              <th style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>Sala</th>
              <th style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>Inicio</th>
              <th style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>Fin</th>
              <th style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>Campus</th>
            </tr>
          </thead>
          <tbody>
            {data.map((evento, index) => (
              <tr key={index}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{evento.tipo}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{evento.evento}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{evento.sala}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{evento.inicio}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{evento.fin}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{evento.campus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
