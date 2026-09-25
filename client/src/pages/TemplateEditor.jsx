import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  ArrowLeft, Upload, Sliders, Save, CheckCircle, 
  Sparkles, Eye, ShieldCheck 
} from 'lucide-react';

export default function TemplateEditor({ event, onBack }) {
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState('coords');
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Template configuration state
  const [config, setConfig] = useState(() => {
    if (event?.template_config) {
      try {
        return typeof event.template_config === 'string'
          ? JSON.parse(event.template_config)
          : event.template_config;
      } catch (e) {
        console.warn(e);
      }
    }
    return {
      name_coords: { x: 421, y: 310, fontSize: 34, color: '#0f172a' },
      event_coords: { x: 421, y: 240, fontSize: 20, color: '#1e293b' },
      date_coords: { x: 230, y: 155, fontSize: 13, color: '#475569' },
      id_coords: { x: 610, y: 155, fontSize: 11, color: '#64748b' },
      qr_coords: { x: 680, y: 70, size: 85 }
    };
  });

  const [bgImageSrc, setBgImageSrc] = useState(event?.template_image || null);

  // Redraw preview canvas whenever config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // A4 ratio 842 x 595
    canvas.width = 842;
    canvas.height = 595;

    // Draw background
    if (bgImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImageSrc;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawElements(ctx, canvas.width, canvas.height);
      };
      img.onerror = () => {
        drawDefaultBackground(ctx, canvas.width, canvas.height);
        drawElements(ctx, canvas.width, canvas.height);
      };
    } else {
      drawDefaultBackground(ctx, canvas.width, canvas.height);
      drawElements(ctx, canvas.width, canvas.height);
    }
  }, [config, bgImageSrc]);

  const drawDefaultBackground = (ctx, w, h) => {
    // Elegant off-white
    ctx.fillStyle = '#fcfdfe';
    ctx.fillRect(0, 0, w, h);

    // Navy border
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // Gold border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    // Department Header Banner
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(w / 2 - 180, 28, 360, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEPARTMENT OF CYBERSECURITY', w / 2, 47);

    // Certificate Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px serif';
    ctx.fillText('CERTIFICATE OF PARTICIPATION', w / 2, 105);

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PROUDLY PRESENTED TO', w / 2, 130);
  };

  const drawElements = (ctx, w, h) => {
    // Helper to flip Y coordinate because PDF coordinate origin is bottom-left
    const toCanvasY = (pdfY) => h - pdfY;

    // 1. Student Name
    ctx.fillStyle = config.name_coords.color || '#0f172a';
    ctx.font = `bold ${config.name_coords.fontSize || 34}px serif`;
    ctx.textAlign = 'center';
    const nameY = toCanvasY(config.name_coords.y);
    ctx.fillText('Arjun Sharma', w / 2, nameY);

    // Context sentence
    ctx.fillStyle = '#475569';
    ctx.font = '13px sans-serif';
    ctx.fillText('has successfully participated in the departmental event & workshop on', w / 2, nameY + 28);

    // 2. Event Title
    ctx.fillStyle = config.event_coords.color || '#1e293b';
    ctx.font = `bold ${config.event_coords.fontSize || 20}px sans-serif`;
    const eventY = toCanvasY(config.event_coords.y);
    ctx.fillText(event?.title || 'Web Security & Bug Bounty Workshop', w / 2, eventY);

    // 3. Date & Cert ID
    ctx.fillStyle = config.date_coords.color || '#475569';
    ctx.font = `${config.date_coords.fontSize || 12}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`Date of Event: ${event?.event_date || '2026-10-15'}`, 80, toCanvasY(config.date_coords.y));
    ctx.fillText(`Credential ID: CERT-CYBER-2026-X89J2`, 80, toCanvasY(config.date_coords.y) + 16);

    // 4. Sample QR Code Box
    const qrSize = config.qr_coords.size || 80;
    const qrX = w - 180;
    const qrY = toCanvasY(config.qr_coords.y) - qrSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);

    ctx.fillStyle = '#0f172a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[Dynamic QR]', qrX + qrSize / 2, qrY + qrSize / 2);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#4f46e5';
    ctx.fillText('Scan to Verify', qrX + qrSize / 2, qrY + qrSize + 14);

    // Signature line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, h - 90);
    ctx.lineTo(240, h - 90);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Head of Department', 85, h - 75);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Department of ${event?.department || 'Cybersecurity'}`, 85, h - 62);
  };

  const handleUploadTemplate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Convert any image format to standard high-quality JPEG Data URI
      let dataUri;
      try {
        dataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Failed to read file.'));
          reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Selected file is not a valid image format.'));
            img.onload = () => {
              let { width, height } = img;
              const maxDim = 2400;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        });
      } catch (convErr) {
        console.warn('Canvas conversion fallback:', convErr);
      }

      let res;
      if (dataUri) {
        res = await fetch(`/api/events/${event.id}/upload-template`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateDataUri: dataUri })
        });
      } else {
        const formData = new FormData();
        formData.append('template', file);
        res = await fetch(`/api/events/${event.id}/upload-template`, {
          method: 'POST',
          body: formData
        });
      }

      const data = await res.json();
      if (res.ok) {
        setBgImageSrc(data.template_image);
        alert('Custom template background uploaded successfully!');
      } else {
        alert(data.error || 'Failed to upload template.');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_config: config })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert('Save error: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Console</span>
        </button>

        <div className="flex items-center space-x-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Layout Saved!</span>
            </span>
          )}
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Save Placement Config</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Canvas Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Live Certificate Layout Preview</span>
            </h3>
            <span className="text-xs text-slate-400">Resolution: Landscape A4</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-full rounded-xl shadow-lg border border-slate-800"
            ></canvas>
          </div>

          <p className="text-xs text-slate-500 text-center">
            The sample above demonstrates real-time rendering of participant credentials and verification QR codes.
          </p>
        </div>

        {/* Right Column: Customizer Controls */}
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Template Customizer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adjust placement coordinates or upload a pre-designed college background.
            </p>
          </div>

          {/* Upload Custom Template */}
          <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2">
            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
            <div>
              <label className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                <span>Upload Custom Certificate Image</span>
                <input
                  type="file"
                  accept="image/*, .jpg, .jpeg, .png, .webp"
                  className="hidden"
                  onChange={handleUploadTemplate}
                  disabled={uploading}
                />
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports any image format (JPG, PNG, WEBP, etc.)</p>
            </div>
            {uploading && <p className="text-xs text-cyan-400">Processing & uploading template...</p>}
          </div>

          {/* Coordinate Adjustment Form */}
          <div className="space-y-4 text-xs">
            {/* Student Name Y-position */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Student Name Vertical Position (Y)</span>
                <span className="font-mono text-indigo-400">{config.name_coords.y}</span>
              </div>
              <input
                type="range"
                min="200"
                max="400"
                value={config.name_coords.y}
                onChange={(e) => setConfig({
                  ...config,
                  name_coords: { ...config.name_coords, y: parseInt(e.target.value) }
                })}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Student Name Font Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Student Name Font Size</span>
                <span className="font-mono text-indigo-400">{config.name_coords.fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="50"
                value={config.name_coords.fontSize}
                onChange={(e) => setConfig({
                  ...config,
                  name_coords: { ...config.name_coords, fontSize: parseInt(e.target.value) }
                })}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Event Title Y-position */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Event Title Vertical Position (Y)</span>
                <span className="font-mono text-cyan-400">{config.event_coords.y}</span>
              </div>
              <input
                type="range"
                min="150"
                max="300"
                value={config.event_coords.y}
                onChange={(e) => setConfig({
                  ...config,
                  event_coords: { ...config.event_coords, y: parseInt(e.target.value) }
                })}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Date & ID Y-position */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Date & ID Position (Y)</span>
                <span className="font-mono text-emerald-400">{config.date_coords.y}</span>
              </div>
              <input
                type="range"
                min="80"
                max="220"
                value={config.date_coords.y}
                onChange={(e) => setConfig({
                  ...config,
                  date_coords: { ...config.date_coords, y: parseInt(e.target.value) }
                })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
