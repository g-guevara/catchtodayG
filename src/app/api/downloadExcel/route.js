// /app/api/downloadExcel/route.js - Versión simplificada para una sola página
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request) {
  try {
    // Obtener parámetro de página
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    
    // Obtener datos de la página específica
    const { data } = await axios.get(`https://hoy.uai.cl/?page=${page}`);
    const $ = cheerio.load(data);
    
    // Extraer total de páginas
    let totalPages = 1;
    const paginationItems = $('nav[aria-label="pagination"] ul li a');
    paginationItems.each((i, el) => {
      const pageNum = parseInt($(el).text().trim());
      if (!isNaN(pageNum) && pageNum > totalPages) {
        totalPages = pageNum;
      }
    });
    
    // Extraer eventos
    const eventos = [];
    $('table tbody tr').each((i, element) => {
      const columns = $(element).find('td');
      
      if (columns.length >= 6) {
        eventos.push({
          tipo: $(columns[0]).find('div').text().trim() || 'Sin tipo',
          evento: $(columns[1]).text().trim(),
          sala: $(columns[2]).text().trim(),
          inicio: $(columns[3]).text().trim(),
          fin: $(columns[4]).text().trim(),
          campus: $(columns[5]).text().trim()
        });
      }
    });
    
    return NextResponse.json({ 
      success: true,
      eventos: eventos,
      paginaActual: page,
      totalPaginas: totalPages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al obtener datos de la página',
      message: error.message
    }, { status: 500 });
  }
}