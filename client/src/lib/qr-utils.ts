import QRCode from 'qrcode';

export async function generateQRCode(data: string, canvas: HTMLCanvasElement): Promise<void> {
  try {
    // Set canvas size explicitly
    canvas.width = 256;
    canvas.height = 256;
    
    await QRCode.toCanvas(canvas, data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function generateQRCodeDataURL(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function downloadQRCode(data: string, filename: string): Promise<void> {
  try {
    const dataURL = await generateQRCodeDataURL(data);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw new Error('Failed to download QR code');
  }
}

export async function printQRCode(data: string, title: string): Promise<void> {
  try {
    const dataURL = await generateQRCodeDataURL(data);
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .qr-url {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
              word-break: break-all;
            }
            img {
              border: 1px solid #ddd;
              padding: 10px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${title}</div>
            <img src="${dataURL}" alt="QR Code" />
            <div class="qr-url">${data}</div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for image to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  } catch (error) {
    console.error('Error printing QR code:', error);
    throw new Error('Failed to print QR code');
  }
}
