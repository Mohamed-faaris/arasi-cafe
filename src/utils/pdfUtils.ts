import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { toast } from 'sonner';

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
