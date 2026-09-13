/**
 * Generates realistic, high-resolution sample customer document photos on offline HTML5 canvas
 * so print-shop operators can test workflows instantly without external image files.
 */

import { DocumentLayer, ID_CARD_DIMENSIONS } from '../types';

function createDocCanvas(w: number, h: number, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, w, h);
  return canvas.toDataURL('image/jpeg', 0.95);
}

// Draw subtle phone camera photographic vignette / background texture
function applyPhonePhotoEffect(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Slight camera lighting vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function generateSampleNidFront(): string {
  // ISO standard ID card aspect ratio 85.6mm x 54mm (approx 1011 x 638 px at 300dpi)
  const w = 1012;
  const h = 638;

  return createDocCanvas(w, h, (ctx) => {
    // Card background with subtle guilloche security wave pattern
    ctx.fillStyle = '#ebf3f7';
    ctx.fillRect(0, 0, w, h);

    // Security guilloche waves
    ctx.strokeStyle = '#c8dfea';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 16) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = i + Math.sin((x + i) * 0.03) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Top Header bar
    ctx.fillStyle = '#0f4c3a';
    ctx.fillRect(30, 24, w - 60, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText('NATIONAL IDENTITY CARD', 120, 66);

    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('DEMOCRATIC REPUBLIC OF GOVERNMENT', 120, 46);

    // Emblem circle
    ctx.beginPath();
    ctx.arc(70, 58, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Photo Box on left
    const px = 60;
    const py = 120;
    const pw = 240;
    const ph = 320;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Silhouette
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 110, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + pw / 2, py + 260, 95, 75, 0, Math.PI, 0);
    ctx.fill();

    // Specimen stamp across photo
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate(-0.35);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAMPLE SPECIMEN', 0, 0);
    ctx.restore();

    // Customer info fields
    ctx.fillStyle = '#334155';
    ctx.font = '13px "Segoe UI", sans-serif';

    const fields = [
      { label: 'Name:', val: 'RAHMAN, MOHAMMAD ARIF' },
      { label: 'Father Name:', val: 'KABIR HOSSAIN RAHMAN' },
      { label: 'Mother Name:', val: 'FATEMA BEGUM' },
      { label: 'Date of Birth:', val: '14 MAY 1988' },
      { label: 'NID No:', val: '1988 5482 9104 2289' },
    ];

    let fy = 145;
    fields.forEach((f) => {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(f.label, 330, fy);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(f.val, 330, fy + 24);
      fy += 56;
    });

    // Hologram ribbon
    const holoGrad = ctx.createLinearGradient(w - 180, 120, w - 100, 440);
    holoGrad.addColorStop(0, '#fdba74');
    holoGrad.addColorStop(0.3, '#86efac');
    holoGrad.addColorStop(0.6, '#93c5fd');
    holoGrad.addColorStop(1, '#f472b6');
    ctx.fillStyle = holoGrad;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(w - 180, 120, 80, 320);
    ctx.globalAlpha = 1.0;

    // Signature
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(330, 440);
    ctx.bezierCurveTo(360, 420, 390, 460, 440, 430);
    ctx.bezierCurveTo(460, 410, 490, 450, 530, 435);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('Holder Signature', 330, 462);

    // Bottom decorative bar
    ctx.fillStyle = '#0f4c3a';
    ctx.fillRect(30, h - 45, w - 60, 12);

    applyPhonePhotoEffect(ctx, w, h);
  });
}

export function generateSampleNidBack(): string {
  const w = 1012;
  const h = 638;

  return createDocCanvas(w, h, (ctx) => {
    ctx.fillStyle = '#ebf3f7';
    ctx.fillRect(0, 0, w, h);

    // Security pattern
    ctx.strokeStyle = '#c8dfea';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 16) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = i + Math.sin((x + i) * 0.03) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Top Header notice
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('This document is government property. If found, please drop in any post box.', 50, 50);

    // Address section
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Residential Address:', 50, 90);

    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('House #42, Road #12, Block-D, Dhanmondi R/A, Dhaka-1209', 50, 115);
    ctx.fillText('Blood Group: O+ (Positive)   |   Issue Date: 12/04/2019', 50, 142);

    // Barcode block
    const bx = 50;
    const by = 180;
    const bw = 500;
    const bh = 90;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#000000';
    for (let x = bx + 10; x < bx + bw - 10; x += 5) {
      const barW = (x % 3 === 0) ? 3 : (x % 2 === 0 ? 1.5 : 2.5);
      ctx.fillRect(x, by + 8, barW, bh - 16);
    }

    // QR Code simulation
    const qx = w - 240;
    const qy = 90;
    const qs = 180;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qx, qy, qs, qs);
    ctx.fillStyle = '#000000';
    ctx.strokeRect(qx, qy, qs, qs);
    // Draw QR markers
    const drawMarker = (x: number, y: number) => {
      ctx.fillRect(x, y, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 7, y + 7, 26, 26);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 13, y + 13, 14, 14);
    };
    drawMarker(qx + 8, qy + 8);
    drawMarker(qx + qs - 48, qy + 8);
    drawMarker(qx + 8, qy + qs - 48);
    // Random QR modules
    for (let r = 0; r < 14; r++) {
      for (let c = 0; c < 14; c++) {
        if ((r * 7 + c * 13) % 5 < 2) {
          ctx.fillRect(qx + 54 + c * 6, qy + 54 + r * 6, 5, 5);
        }
      }
    }

    // MRZ (Machine Readable Zone) at bottom
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(30, h - 190, w - 60, 140);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(30, h - 190, w - 60, 140);

    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('I<BGD198854829104<<<<<<<<<<<<<<<', 50, h - 130);
    ctx.fillText('8805142M2904124BGD<<<<<<<<<<<<<8', 50, h - 90);
    ctx.fillText('RAHMAN<<MOHAMMAD<ARIF<<<<<<<<<<<', 50, h - 50);

    applyPhonePhotoEffect(ctx, w, h);
  });
}

export function generateSampleBirthRegistration(): string {
  // A4 vertical proportions: e.g. 1200 x 1700 px
  const w = 1200;
  const h = 1700;

  return createDocCanvas(w, h, (ctx) => {
    // Parchment certificate background
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, w, h);

    // Certificate ornate borders
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(48, 48, w - 96, h - 96);

    // Top Emblem
    ctx.beginPath();
    ctx.arc(w / 2, 140, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#065f46';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOVT', w / 2, 146);

    // Title
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('OFFICE OF THE REGISTRAR GENERAL', w / 2, 230);
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillStyle = '#9a3412';
    ctx.fillText('BIRTH REGISTRATION CERTIFICATE', w / 2, 275);
    ctx.font = '17px "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('[Rule 9 of Birth & Death Registration Act, 2004]', w / 2, 310);

    ctx.textAlign = 'left';

    // Reg Number Box
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(80, 345, w - 160, 56);
    ctx.strokeStyle = '#059669';
    ctx.strokeRect(80, 345, w - 160, 56);
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('Birth Registration No:  2004 2692 0184 9283 1', 110, 381);

    // Details Grid
    const info = [
      { label: 'Full Name:', val: 'TANVIR AHMED' },
      { label: 'Date of Birth:', val: '08 AUGUST 2004 (EIGHTH OF AUGUST TWO THOUSAND FOUR)' },
      { label: 'Gender:', val: 'MALE' },
      { label: 'Place of Birth:', val: 'DHAKA MEDICAL COLLEGE HOSPITAL, DHAKA' },
      { label: "Father's Name:", val: 'MD. ALAUDDIN CHOWDHURY' },
      { label: "Father's Nationality:", val: 'BANGLADESHI' },
      { label: "Mother's Name:", val: 'SHAHANARA CHOWDHURY' },
      { label: "Mother's Nationality:", val: 'BANGLADESHI' },
      { label: 'Permanent Address:', val: 'VILL: KRISHNAPUR, P.O: BOGRA SADAR, DIST: BOGRA' },
    ];

    let y = 450;
    info.forEach((item) => {
      ctx.fillStyle = '#64748b';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(item.label, 90, y);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(item.val, 320, y);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(90, y + 16);
      ctx.lineTo(w - 90, y + 16);
      ctx.stroke();

      y += 65;
    });

    // Official Stamp Circle
    ctx.save();
    ctx.translate(220, h - 300);
    ctx.rotate(-0.15);
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(37, 99, 235, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('REGISTRAR OF BIRTHS', 0, -20);
    ctx.fillText('★ VERIFIED ★', 0, 8);
    ctx.fillText('DHAKA NORTH', 0, 35);
    ctx.restore();

    // Signature on right
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w - 380, h - 280);
    ctx.bezierCurveTo(w - 340, h - 310, w - 280, h - 260, w - 220, h - 290);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('Registrar Signature & Seal', w - 300, h - 230);
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('Date of Issuance: 15/09/2004', w - 300, h - 205);

    applyPhonePhotoEffect(ctx, w, h);
  });
}

export function generateSampleCertificate(): string {
  // Landscape Certificate: 1600 x 1150 px
  const w = 1600;
  const h = 1150;

  return createDocCanvas(w, h, (ctx) => {
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, w, h);

    // Decorative Gold border
    ctx.strokeStyle = '#c29d38';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    ctx.textAlign = 'center';

    // University Header
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 44px "Segoe UI", sans-serif';
    ctx.fillText('METROPOLITAN TECHNICAL UNIVERSITY', w / 2, 170);

    ctx.fillStyle = '#c29d38';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('FACULTY OF COMPUTER SCIENCE & ENGINEERING', w / 2, 220);

    ctx.fillStyle = '#475569';
    ctx.font = 'italic 26px "Segoe UI", sans-serif';
    ctx.fillText('This is to certify that', w / 2, 340);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillText('NAEEMUL ISLAM', w / 2, 420);

    ctx.fillStyle = '#475569';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText('has fulfilled all academic requirements and is hereby awarded the degree of', w / 2, 500);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('BACHELOR OF SCIENCE IN SOFTWARE ENGINEERING', w / 2, 570);

    ctx.fillStyle = '#334155';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('With First Class Honors and Distinction (CGPA 3.89 / 4.00)', w / 2, 630);

    // Gold Medal Seal
    const mx = w / 2;
    const my = 850;
    ctx.beginPath();
    ctx.arc(mx, my, 80, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText('OFFICIAL', mx, my - 12);
    ctx.fillText('SEAL', mx, my + 14);

    // Left Signature (Dean)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(250, 840);
    ctx.bezierCurveTo(300, 800, 360, 860, 420, 830);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText('Dean of Faculty', 335, 880);

    // Right Signature (Vice Chancellor)
    ctx.beginPath();
    ctx.moveTo(w - 420, 840);
    ctx.bezierCurveTo(w - 360, 800, w - 300, 860, w - 250, 830);
    ctx.stroke();
    ctx.fillText('Vice Chancellor', w - 335, 880);

    applyPhonePhotoEffect(ctx, w, h);
  });
}

export function generateSamplePassportFront(): string {
  // Passport Bio Page (125mm x 88mm aspect ratio -> 1250 x 880 px)
  const w = 1250;
  const h = 880;

  return createDocCanvas(w, h, (ctx) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    // Top Header
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(40, 30, w - 80, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText('PASSPORT / PASSEPORT', 80, 75);

    // Photo Box
    const px = 70;
    const py = 130;
    const pw = 280;
    const ph = 380;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Silhouette
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + 130, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + pw / 2, py + 310, 110, 90, 0, Math.PI, 0);
    ctx.fill();

    // Specimen stamp
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate(-0.3);
    ctx.fillStyle = 'rgba(220, 38, 38, 0.4)';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAMPLE', 0, 0);
    ctx.restore();

    // Data Fields
    ctx.textAlign = 'left';
    const fields = [
      { l: 'Type / Code', v: 'P / BGD' },
      { l: 'Passport No.', v: 'EA0984712' },
      { l: 'Surname', v: 'HOSSAIN' },
      { l: 'Given Names', v: 'MOHAMMAD SHAKIL' },
      { l: 'Nationality', v: 'BANGLADESHI' },
      { l: 'Date of Birth', v: '21 NOV 1993' },
      { l: 'Sex / Place of Birth', v: 'M / SYLHET' },
      { l: 'Date of Expiry', v: '18 OCT 2031' },
    ];

    let fy = 150;
    fields.forEach((f, idx) => {
      const colX = idx % 2 === 0 ? 390 : 780;
      if (idx % 2 === 0 && idx !== 0) fy += 65;

      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(f.l, colX, fy);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(f.v, colX, fy + 22);
    });

    // MRZ at bottom
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, h - 180, w - 80, 140);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(40, h - 180, w - 80, 140);

    ctx.font = 'bold 25px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('P<BGDHOSSAIN<<MOHAMMAD<SHAKIL<<<<<<<<<<<<<<<', 60, h - 110);
    ctx.fillText('EA09847125BGD9311218M3110182<<<<<<<<<<<<<<04', 60, h - 60);

    applyPhonePhotoEffect(ctx, w, h);
  });
}

export function createSampleNidFrontLayer(x = 62.2, y = 55.0): DocumentLayer {
  const dataUrl = generateSampleNidFront();
  return {
    id: 'layer-nid-front',
    name: 'NID Front (Card)',
    src: dataUrl,
    originalWidth: 1012,
    originalHeight: 638,
    x,
    y,
    width: ID_CARD_DIMENSIONS.widthMm, // 85.60 mm
    height: ID_CARD_DIMENSIONS.heightMm, // 54.00 mm
    rotation: 0,
    aspectRatioLocked: true,
    locked: false,
    visible: true,
    crop: null,
    perspectivePoints: null,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      grayscale: false,
      blackAndWhite: false,
      bwThreshold: 128,
    },
  };
}

export function createSampleNidBackLayer(x = 62.2, y = 125.0): DocumentLayer {
  const dataUrl = generateSampleNidBack();
  return {
    id: 'layer-nid-back',
    name: 'NID Back (Card)',
    src: dataUrl,
    originalWidth: 1012,
    originalHeight: 638,
    x,
    y,
    width: ID_CARD_DIMENSIONS.widthMm, // 85.60 mm
    height: ID_CARD_DIMENSIONS.heightMm, // 54.00 mm
    rotation: 0,
    aspectRatioLocked: true,
    locked: false,
    visible: true,
    crop: null,
    perspectivePoints: null,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      grayscale: false,
      blackAndWhite: false,
      bwThreshold: 128,
    },
  };
}

export function createSampleBirthRegistrationLayer(): DocumentLayer {
  const dataUrl = generateSampleBirthRegistration();
  return {
    id: 'layer-birth-reg',
    name: 'Birth Registration Certificate',
    src: dataUrl,
    originalWidth: 1200,
    originalHeight: 1700,
    x: 15,
    y: 13.5,
    width: 180,
    height: 255,
    rotation: 0,
    aspectRatioLocked: true,
    locked: false,
    visible: true,
    crop: null,
    perspectivePoints: null,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      grayscale: false,
      blackAndWhite: false,
      bwThreshold: 128,
    },
  };
}

export function createSampleCertificateLayer(): DocumentLayer {
  const dataUrl = generateSampleCertificate();
  return {
    id: 'layer-certificate',
    name: 'Degree Certificate',
    src: dataUrl,
    originalWidth: 1600,
    originalHeight: 1150,
    x: 18.5,
    y: 15,
    width: 260,
    height: 180,
    rotation: 0,
    aspectRatioLocked: true,
    locked: false,
    visible: true,
    crop: null,
    perspectivePoints: null,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      grayscale: false,
      blackAndWhite: false,
      bwThreshold: 128,
    },
  };
}

export function createSamplePassportLayer(): DocumentLayer {
  const dataUrl = generateSamplePassportFront();
  return {
    id: 'layer-passport',
    name: 'Passport Bio Page',
    src: dataUrl,
    originalWidth: 1250,
    originalHeight: 880,
    x: 35,
    y: 70,
    width: 140,
    height: 98.56,
    rotation: 0,
    aspectRatioLocked: true,
    locked: false,
    visible: true,
    crop: null,
    perspectivePoints: null,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      grayscale: false,
      blackAndWhite: false,
      bwThreshold: 128,
    },
  };
}

