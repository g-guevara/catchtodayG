export const runtime = "nodejs";

import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    console.log("🔍 Iniciando Puppeteer...");

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    });

    console.log("✅ Puppeteer iniciado correctamente");

    const page = await browser.newPage();
    const downloadPath = "/tmp"; // 📂 Solo /tmp es permitido en Vercel
    console.log(`📂 Configurando carpeta de descargas en: ${downloadPath}`);

    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    await page.goto("https://hoy.uai.cl/", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 🔹 Intentar hacer clic en el botón de descarga
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
      console.error("❌ No se encontró el botón de descarga.");
      await browser.close();
      return NextResponse.json({ success: false, error: "No se encontró el botón de descarga" }, { status: 500 });
    }

    console.log("⌛ Esperando que el archivo se descargue...");

    // 🔹 Verificar si el archivo fue descargado
    let filePath = "";
    let attempts = 0;
    while (attempts < 10) {
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

    // 📌 Devolver el archivo como respuesta
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="eventos.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Error al descargar el Excel:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
