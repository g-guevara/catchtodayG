export const runtime = "nodejs";

import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function GET() {
  try {
    const browser = await puppeteer.launch({
      headless: "new", // ✅ Esto soluciona problemas con Puppeteer en servidores
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium", // ✅ Ruta para entornos serverless
    });

    const page = await browser.newPage();

    await page.goto("https://hoy.uai.cl/", { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 5000));

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

    console.log("⌛ Esperando que la página procese la descarga...");

    let excelURL = "";
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".xlsx")) {
        excelURL = url;
        console.log("🔍 URL del Excel encontrada:", url);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    if (!excelURL) {
      console.error("❌ No se encontró la URL del Excel.");
      await browser.close();
      return NextResponse.json({ success: false, error: "No se encontró la URL del Excel" }, { status: 500 });
    }

    await browser.close();
    return NextResponse.json({ success: true, fileUrl: excelURL });
  } catch (error) {
    console.error("Error al descargar el Excel:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
