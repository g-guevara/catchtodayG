"use client";

import { useState, useEffect } from "react";

export default function DownloadAndReadExcel() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [logMessages, setLogMessages] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const addLog = (message) => {
    setLogMessages((prevLogs) => [...prevLogs, message]);
  };

  const fetchPage = async (page) => {
    const response = await fetch(`/api/downloadExcel?page=${page}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setStatus("loading");
      setLogMessages(["🔍 Iniciando obtención de datos..."]);
      
      // Obtener primera página para conocer total de páginas
      const firstPageData = await fetchPage(1);
      
      if (!firstPageData.success) {
        throw new Error(firstPageData.message || "Error obteniendo datos");
      }
      
      const totalPages = firstPageData.totalPaginas;
      setProgress({ current: 1, total: totalPages });
      
      // Agregar eventos de la primera página
      let allEvents = [...firstPageData.eventos];
      addLog(`✅ Página 1/${totalPages} completada. ${firstPageData.eventos.length} eventos cargados.`);
      
      // Cargar el resto de páginas secuencialmente
      for (let page = 2; page <= totalPages; page++) {
        addLog(`⏳ Cargando página ${page}/${totalPages}...`);
        const pageData = await fetchPage(page);
        
        if (!pageData.success) {
          throw new Error(`Error en página ${page}: ${pageData.message}`);
        }
        
        allEvents = [...allEvents, ...pageData.eventos];
        setProgress({ current: page, total: totalPages });
        addLog(`✅ Página ${page}/${totalPages} completada. Total: ${allEvents.length} eventos.`);
        
        // Actualizar los datos para mostrar el progreso
        setData(allEvents);
      }
      
      setAllData(allEvents);
      setStatus("success");
      addLog(`🎉 ¡Carga completa! Se obtuvieron ${allEvents.length} eventos en total.`);
    } catch (error) {
      setStatus("error");
      addLog(`❌ Error: ${error.message}`);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setStatus("downloading");
      addLog("📥 Generando archivo Excel...");
      
      const response = await fetch("/api/downloadExcelFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventos: allData }),
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'eventos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      addLog("✅ Archivo Excel descargado con éxito.");
    } catch (error) {
      setStatus("error");
      addLog(`❌ Error descargando Excel: ${error.message}`);
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <button
        onClick={fetchAllData}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#6C757D" : "#007BFF",
          color: "white",
          padding: "10px 20px",
          fontSize: "16px",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Cargando..." : "Obtener todos los datos"}
      </button>
      
      {/* Barra de progreso */}
      {loading && progress.total > 0 && (
        <div style={{ margin: "20px auto", width: "80%", maxWidth: "600px" }}>
          <div style={{ 
            backgroundColor: "#e0e0e0", 
            borderRadius: "4px",
            height: "20px", 
            overflow: "hidden"
          }}>
            <div style={{ 
              backgroundColor: "#4CAF50", 
              height: "100%", 
              width: `${(progress.current / progress.total) * 100}%`,
              transition: "width 0.3s ease"
            }}></div>
          </div>
          <p>{`Progreso: ${progress.current}/${progress.total} páginas (${Math.round((progress.current / progress.total) * 100)}%)`}</p>
        </div>
      )}

      {/* Log de mensajes */}
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f8f9fa", border: "1px solid #ddd", borderRadius: "5px", textAlign: "left", width: "80%", margin: "20px auto", maxHeight: "200px", overflowY: "auto" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Estado del Proceso:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {logMessages.map((msg, index) => (
            <li key={index} style={{ fontSize: "14px", marginBottom: "5px" }}>
              {msg}
            </li>
          ))}
        </ul>
      </div>

      {/* Botón para descargar Excel */}
      {data.length > 0 && (
        <button
          onClick={downloadExcel}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "10px 20px",
            margin: "10px",
            fontSize: "16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Descargar Excel ({data.length} eventos)
        </button>
      )}

      {/* Tabla de datos */}
      {data.length > 0 && (
        <div style={{ margin: "20px auto", width: "90%", overflowX: "auto" }}>
          <p>Mostrando {data.length} eventos</p>
          <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
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
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{evento.tipo}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{evento.evento}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{evento.sala}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{evento.inicio}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{evento.fin}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{evento.campus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}