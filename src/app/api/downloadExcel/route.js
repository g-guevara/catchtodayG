export const runtime = "nodejs";

import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    console.log("🔍 Iniciando Puppeteer...");

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (await import("puppeteer")).default.executablePath(),
    });

    console.log("✅ Puppeteer iniciado correctamente");

    const page = await browser.newPage();

    // 🔹 Configurar Puppeteer para manejar descargas de archivos blob
    const downloadPath = path.join(process.cwd(), "public");
    console.log(`📂 Configurando carpeta de descargas en: ${downloadPath}`);

    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath, // 📂 Guardar el archivo en `public/`
    });

    await page.goto("https://hoy.uai.cl/", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 🔹 Buscar el botón y hacer clic en él
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

    // 🔹 Devolver la ruta del archivo descargado para que el frontend lo pueda acceder
    return NextResponse.json({ success: true, fileUrl: `/${path.basename(filePath)}` });
  } catch (error) {
    console.error("Error al descargar el Excel:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
