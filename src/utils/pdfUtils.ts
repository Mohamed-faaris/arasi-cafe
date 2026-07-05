import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { toast } from 'sonner';

const waitForFonts = (): Promise<void> =>
  document.fonts?.ready
    ? document.fonts.ready.then(() => {}).catch(() => {})
    : new Promise((r) => setTimeout(r, 500));

export async function generatePdfBlob(element: HTMLElement): Promise<Blob | null> {
  if (!element) return null;
  try {
    await waitForFonts();

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    let heightLeft = imgHeight - pageHeight;
    let position = -pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } catch (e) {
    console.error('PDF generation failed:', e);
    return null;
  }
}

export async function downloadPdf(blob: Blob, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: fileName,
      text: fileName,
      files: [saved.uri],
    });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export async function sharePdf(blob: Blob, fileName: string, title: string, text: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({ title, text, files: [saved.uri] });
      Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
    } catch (e) {
      if (e instanceof Error && !e.message.includes('cancelled')) {
        toast.error('Share failed');
      }
    }
  } else {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text });
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          toast.error('Share failed');
        }
      }
    } else {
      toast.info('Sharing not supported on this browser');
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
