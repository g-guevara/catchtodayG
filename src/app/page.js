"use client"; // Necesario en App Router

import { useState } from "react";
import * as XLSX from "xlsx";

export default function DownloadAndReadExcel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/downloadExcel");
      const result = await response.json();

      if (!result.success) {
        alert("Error al descargar el archivo");
        return;
      }

      // Leer el archivo Excel descargado
      readExcel(result.fileUrl);
    } catch (error) {
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
      console.log("📊 Datos leídos del Excel:", jsonData);
    } catch (error) {
      console.error("Error al leer el archivo:", error);
    }
  };

  return (
    <div>
      <button onClick={downloadExcel} disabled={loading}>
        {loading ? "Descargando..." : "Descargar y leer Excel"}
      </button>

      {data.length > 0 && (
        <table border="1">
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
