/** "YYYY-MM-DD" en hora local (toISOString usaría UTC y en Colombia de noche daría el día siguiente). */
export const formatLocalDate = (date: Date | null): string => {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Parsea "YYYY-MM-DD" como medianoche local (new Date("YYYY-MM-DD") es UTC y resta un día en UTC-5). */
export const parseLocalDate = (str: string | null | undefined): Date | null => {
  const m = str?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};
