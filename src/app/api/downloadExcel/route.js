export const runtime = "nodejs"; // ✅ Forzar Next.js a usar Node.js en el backend

import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const downloadPath = path.join(process.cwd(), "public"); // 📂 Carpeta donde se guardará el archivo
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Configurar Puppeteer para manejar descargas de archivos blob
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath, // 📂 Guardar el archivo en la carpeta public
    });

    await page.goto("https://hoy.uai.cl/", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 🔹 Buscar el botón con `page.evaluate()` en lugar de `page.$x()`
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const downloadButton = buttons.find((btn) => btn.textContent.includes("Descargar Excel"));
      if (downloadButton) {
        downloadButton.click();
        return true;
      }
      return false;
    });

    if (!buttonClicked) {
      await browser.close();
      return NextResponse.json({ success: false, error: "No se encontró el botón de descarga" }, { status: 500 });
    }

    console.log("⌛ Esperando que el archivo se descargue...");

    // 🔹 Esperar hasta que el archivo aparezca en la carpeta de descargas
    let filePath = "";
    let attempts = 0;
    while (attempts < 10) { // Intentamos por 10 segundos
      const files = fs.readdirSync(downloadPath);
      const excelFile = files.find(file => file.endsWith(".xlsx"));

      if (excelFile) {
        filePath = path.join(downloadPath, excelFile);
        console.log("📂 Archivo descargado:", filePath);
        break;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1s antes de volver a verificar
    }

    if (!filePath) {
      console.error("❌ No se encontró el archivo Excel después de descargarlo.");
      await browser.close();
      return NextResponse.json({ success: false, error: "No se encontró el archivo Excel en la carpeta de descargas" }, { status: 500 });
    }

    await browser.close();

    return NextResponse.json({ success: true, fileUrl: "/eventos.xlsx" });
  } catch (error) {
    console.error("Error al descargar el Excel:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
