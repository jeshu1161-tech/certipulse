import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { certsDir } from '../db.js';

export async function generateCertificate({
  studentName,
  eventTitle,
  eventDate,
  department = 'Cybersecurity',
  certId,
  templatePath = null,
  templateConfig = null,
  verifyBaseUrl = 'http://localhost:5173/verify'
}) {
  const verifyUrl = `${verifyBaseUrl}/${certId}`;
  
  // 1. Generate QR Code Data URL (PNG)
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 200,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    }
  });
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  // 2. Create PDF Document (Landscape A4: 841.89 x 595.28 points)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  // If a custom template image is provided (Data URI or file path), embed it
  let bgImageEmbedded = false;
  if (templatePath) {
    let templateBytes = null;
    if (typeof templatePath === 'string' && templatePath.startsWith('data:')) {
      const base64Index = templatePath.indexOf('base64,');
      if (base64Index !== -1) {
        templateBytes = Buffer.from(templatePath.slice(base64Index + 7), 'base64');
      }
    } else if (typeof templatePath === 'string' && fs.existsSync(templatePath)) {
      templateBytes = fs.readFileSync(templatePath);
    }

    if (templateBytes && templateBytes.length > 0) {
      let bgImage = null;
      try {
        bgImage = await pdfDoc.embedJpg(templateBytes);
      } catch (jpgErr) {
        try {
          bgImage = await pdfDoc.embedPng(templateBytes);
        } catch (pngErr) {
          console.warn('Could not embed custom template as JPG or PNG:', pngErr.message);
        }
      }

      if (bgImage) {
        page.drawImage(bgImage, {
          x: 0,
          y: 0,
          width,
          height
        });
        bgImageEmbedded = true;
      }
    }
  }

  if (!bgImageEmbedded) {
    // Render default high-end academic design
    drawProfessionalCertificateBackground(page, width, height);

    // Draw Default Certificate Header Texts
    const collegeText = "DEPARTMENT OF CYBERSECURITY";
    const collegeWidth = fontBold.widthOfTextAtSize(collegeText, 13);
    page.drawText(collegeText, {
      x: (width - collegeWidth) / 2,
      y: height - 53,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const mainTitle = "CERTIFICATE OF PARTICIPATION";
    const titleWidth = fontTimes.widthOfTextAtSize(mainTitle, 28);
    page.drawText(mainTitle, {
      x: (width - titleWidth) / 2,
      y: height - 120,
      size: 28,
      font: fontTimes,
      color: rgb(0.08, 0.15, 0.35),
    });

    const certSubtitle = "PROUDLY PRESENTED TO";
    const subWidth = fontBold.widthOfTextAtSize(certSubtitle, 11);
    page.drawText(certSubtitle, {
      x: (width - subWidth) / 2,
      y: height - 150,
      size: 11,
      font: fontBold,
      color: rgb(0.85, 0.65, 0.13),
    });
  }

  // Parse template configuration coordinates if available
  let config = {
    name_coords: { x: width / 2, y: height * 0.52, fontSize: 34, color: '#0f172a' },
    event_coords: { x: width / 2, y: height * 0.40, fontSize: 20, color: '#1e293b' },
    date_coords: { x: 230, y: height * 0.22, fontSize: 13, color: '#475569' },
    id_coords: { x: 610, y: height * 0.22, fontSize: 12, color: '#64748b' },
    qr_coords: { x: width / 2 - 40, y: height * 0.14, size: 80 }
  };

  if (templateConfig) {
    try {
      const parsed = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : templateConfig;
      config = { ...config, ...parsed };
    } catch (e) {
      console.warn('Failed to parse template config, using default coordinates', e);
    }
  }

  // Draw Dynamic Text Elements
  // 1. Student Name (Centered)
  const nameWidth = fontTimes.widthOfTextAtSize(studentName, config.name_coords.fontSize);
  page.drawText(studentName, {
    x: (width - nameWidth) / 2,
    y: config.name_coords.y,
    size: config.name_coords.fontSize,
    font: fontTimes,
    color: rgb(0.06, 0.09, 0.16),
  });

  // Underline beneath name
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 30, y: config.name_coords.y - 8 },
    end: { x: (width + nameWidth) / 2 + 30, y: config.name_coords.y - 8 },
    thickness: 1.5,
    color: rgb(0.85, 0.65, 0.13), // Gold underline
  });

  // Context sentence
  const contextText = `has successfully participated in the departmental event & workshop on`;
  const contextWidth = fontRegular.widthOfTextAtSize(contextText, 14);
  page.drawText(contextText, {
    x: (width - contextWidth) / 2,
    y: config.name_coords.y - 35,
    size: 14,
    font: fontRegular,
    color: rgb(0.28, 0.33, 0.41),
  });

  // 2. Event Title (Centered)
  const eventWidth = fontBold.widthOfTextAtSize(eventTitle, config.event_coords.fontSize);
  page.drawText(eventTitle, {
    x: (width - eventWidth) / 2,
    y: config.event_coords.y,
    size: config.event_coords.fontSize,
    font: fontBold,
    color: rgb(0.12, 0.23, 0.54), // Navy
  });

  // Department credit line
  const deptText = `Organized by the Department of ${department}`;
  const deptWidth = fontOblique.widthOfTextAtSize(deptText, 13);
  page.drawText(deptText, {
    x: (width - deptWidth) / 2,
    y: config.event_coords.y - 25,
    size: 13,
    font: fontOblique,
    color: rgb(0.35, 0.4, 0.48),
  });

  // 3. Issue Date
  page.drawText(`Date of Event: ${eventDate}`, {
    x: 90,
    y: config.date_coords.y,
    size: config.date_coords.fontSize,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  // 4. Unique Certificate Verification ID
  page.drawText(`Credential ID: ${certId}`, {
    x: 90,
    y: config.date_coords.y - 18,
    size: 11,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // 5. Digital Verification QR Code
  page.drawImage(qrImage, {
    x: width - 180,
    y: 80,
    width: 85,
    height: 85,
  });

  page.drawText('Scan to Verify', {
    x: width - 170,
    y: 65,
    size: 10,
    font: fontBold,
    color: rgb(0.12, 0.23, 0.54),
  });

  // 6. Signatures placeholder
  page.drawLine({
    start: { x: 90, y: 110 },
    end: { x: 260, y: 110 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });
  page.drawText('Head of Department', {
    x: 115,
    y: 92,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });
  page.drawText('Department of ' + department, {
    x: 100,
    y: 78,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const filePath = path.join(certsDir, `${certId}.pdf`);
  try {
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }
    fs.writeFileSync(filePath, pdfBytes);
  } catch (err) {
    console.warn('Could not write certificate PDF file to disk:', err.message);
  }

  return {
    filePath,
    pdfBytes,
    verifyUrl
  };
}

function drawProfessionalCertificateBackground(page, width, height) {
  // Deep elegant background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.995, 0.995, 1.0),
  });

  // Outer Navy Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.08, 0.15, 0.35),
    borderWidth: 3.5,
  });

  // Inner Gold Border
  page.drawRectangle({
    x: 27,
    y: 27,
    width: width - 54,
    height: height - 54,
    borderColor: rgb(0.85, 0.65, 0.13),
    borderWidth: 1.2,
  });

  // Corner decorative accents
  const corners = [
    { x: 34, y: 34 },
    { x: width - 34, y: 34 },
    { x: 34, y: height - 34 },
    { x: width - 34, y: height - 34 }
  ];
  for (const c of corners) {
    page.drawCircle({
      x: c.x,
      y: c.y,
      size: 4,
      color: rgb(0.85, 0.65, 0.13),
    });
  }

  // Top College / Department Banner Line
  page.drawRectangle({
    x: width / 2 - 180,
    y: height - 60,
    width: 360,
    height: 24,
    color: rgb(0.08, 0.15, 0.35),
  });

  // Decorative Golden Seal Circle on Left
  page.drawCircle({
    x: 95,
    y: height - 85,
    size: 32,
    color: rgb(0.95, 0.85, 0.4),
    borderColor: rgb(0.85, 0.65, 0.13),
    borderWidth: 2,
  });
}
