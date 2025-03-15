// /app/api/downloadExcel/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';

export async function GET(request) {
  try {
    // Obtener la primera página para analizar la paginación
    const { data: firstPageData } = await axios.get('https://hoy.uai.cl');
    const $firstPage = cheerio.load(firstPageData);
    
    // Buscar el número total de páginas
    let totalPages = 1;
    const paginationItems = $firstPage('nav[aria-label="pagination"] ul li a');
    paginationItems.each((i, el) => {
      const pageNum = parseInt($firstPage(el).text().trim());
      if (!isNaN(pageNum) && pageNum > totalPages) {
        totalPages = pageNum;
      }
    });
    console.log(`Detectadas ${totalPages} páginas en total`);

    // Inicializar el array que contendrá todos los eventos
    let allEvents = [];
    
    // Procesar los eventos de la primera página (ya tenemos los datos)
    $firstPage('table tbody tr').each((i, element) => {
      const columns = $firstPage(element).find('td');
      
      if (columns.length >= 6) {
        allEvents.push({
          tipo: $firstPage(columns[0]).find('div').text().trim() || 'Sin tipo',
          evento: $firstPage(columns[1]).text().trim(),
          sala: $firstPage(columns[2]).text().trim(),
          inicio: $firstPage(columns[3]).text().trim(),
          fin: $firstPage(columns[4]).text().trim(),
          campus: $firstPage(columns[5]).text().trim()
        });
      }
    });
    
    console.log(`Procesada página 1 de ${totalPages}. Eventos hasta ahora: ${allEvents.length}`);

    // Extraer eventos de las páginas restantes (empezando desde la página 2)
    for (let page = 2; page <= totalPages; page++) {
      console.log(`Procesando página ${page} de ${totalPages}...`);
      
      // Hacer la solicitud a la página actual
      const { data } = await axios.get(`https://hoy.uai.cl/?page=${page}`);
      const $ = cheerio.load(data);
      
      // Extraer los datos de la tabla en esta página
      $('table tbody tr').each((i, element) => {
        const columns = $(element).find('td');
        
        if (columns.length >= 6) {
          allEvents.push({
            tipo: $(columns[0]).find('div').text().trim() || 'Sin tipo',
            evento: $(columns[1]).text().trim(),
            sala: $(columns[2]).text().trim(),
            inicio: $(columns[3]).text().trim(),
            fin: $(columns[4]).text().trim(),
            campus: $(columns[5]).text().trim()
          });
        }
      });
      
      console.log(`Procesada página ${page} de ${totalPages}. Eventos hasta ahora: ${allEvents.length}`);
      
      // Pequeña pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Extracción completa. Obtenidos ${allEvents.length} eventos en total.`);

    // Obtener el formato de la URL
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    
    // Preparar el Excel para descargas o responder con JSON
    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(allEvents);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");
      
      // Ajustar ancho de columnas
      const columns = [
        { wch: 15 },  // tipo
        { wch: 50 },  // evento
        { wch: 20 },  // sala
        { wch: 10 },  // inicio
        { wch: 10 },  // fin
        { wch: 15 }   // campus
      ];
      worksheet['!cols'] = columns;
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=eventos.xlsx'
        }
      });
    } else {
      // Responder con el formato que espera el componente React
      return NextResponse.json({ 
        success: true,
        eventos: allEvents,
        totalEventos: allEvents.length,
        totalPaginas: totalPages,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener datos de la página',
      message: error.message
    }, { status: 500 });
  }
}