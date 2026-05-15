export function toApiError(message: string, statusCode = 400) {
  const error = new Error(message);
  Object.assign(error, { statusCode });
  return error;
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

export function parseDateForMercadoPublico(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}${month}${year}`;
}
