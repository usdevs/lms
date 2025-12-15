import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formDataToObject = (formData: FormData) => {
  const obj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    if (obj[key] === undefined) {
      obj[key] = value;
    } else if (Array.isArray(obj[key])) {
      obj[key].push(value);
    } else {
      obj[key] = [obj[key], value];
    }
  }
  return obj;
};

export const objectToFormData = (values: Record<string, unknown>) => {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

