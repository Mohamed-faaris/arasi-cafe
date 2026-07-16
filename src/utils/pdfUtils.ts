import { toast } from "sonner";

export async function downloadPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function sharePdfBlob(blob: Blob, fileName: string, title: string) {
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: title });
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        toast.error("Share failed");
      }
    }
  } else {
    toast.info("Sharing not supported on this browser. Use Download instead.");
  }
}
