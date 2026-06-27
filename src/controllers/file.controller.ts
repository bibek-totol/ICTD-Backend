import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Proxy endpoint to serve PDF files with inline Content-Disposition header
 * This allows PDFs to open in browser instead of downloading
 * Supports @react-pdf-viewer with proper CORS and headers
 */
export const servePdfInline = async (req: Request, res: Response) => {
  // Set CORS headers early to ensure they are present even on errors
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url } = req.query;

    console.log('📄 PDF Proxy Request - URL:', url);

    if (!url || typeof url !== 'string') {
      console.error('❌ No URL provided');
      return res.status(400).json({
        success: false,
        message: 'URL parameter is required',
      });
    }

    // Validate that it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
      console.error('❌ Invalid URL - not Cloudinary');
      return res.status(400).json({
        success: false,
        message: 'Invalid URL',
      });
    }

    // Cloudinary raw files sometimes need the extension, sometimes don't.
    // We'll try the exact URL first.
    const fetchUrl = url;

    console.log('🔄 Fetching PDF from Cloudinary URL:', fetchUrl);

    try {
      // Fetch the file from Cloudinary
      const response = await axios.get(fetchUrl, {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/pdf',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('✅ PDF fetched successfully, size:', response.data.byteLength, 'bytes');

      // Set headers to display PDF inline in browser
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Accept-Ranges', 'bytes'); // Support range requests for PDF streaming

      // Send the PDF data
      return res.send(Buffer.from(response.data));
    } catch (fetchError: any) {
      console.warn('⚠️ Initial fetch failed, trying alternative URL...');

      // If it's a raw file and ends with .pdf, Cloudinary sometimes doesn't want the .pdf for the binary fetch
      if (fetchUrl.includes('/raw/upload/') && fetchUrl.endsWith('.pdf')) {
        const altUrl = fetchUrl.replace('.pdf', '');
        console.log('🔄 Trying alternative URL:', altUrl);

        const altResponse = await axios.get(altUrl, {
          responseType: 'arraybuffer',
          headers: {
            Accept: 'application/pdf',
          },
          timeout: 30000,
        });

        console.log('✅ PDF fetched successfully via alternative URL');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Accept-Ranges', 'bytes');
        return res.send(Buffer.from(altResponse.data));
      }

      throw fetchError; // Re-throw if no alt URL was tried or alt fetch failed
    }
  } catch (error: any) {
    console.error('❌ Error serving PDF:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   URL:', req.query.url);

    // Ensure CORS headers even on errors
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(500).json({
      success: false,
      message: 'Failed to load PDF',
      error: error.message,
      details: error.response?.statusText,
    });
  }
};
