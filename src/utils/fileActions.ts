export const exportJsonFile = (fileName: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  downloadBlobFile(fileName, blob);
};

export const downloadBlobFile = (fileName: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const readJsonFile = async <T>(file: File): Promise<T> => {
  const text = await file.text();
  return JSON.parse(text) as T;
};
