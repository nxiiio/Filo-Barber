import type { CustomerData } from "../../types";

export type CustomerErrors = Partial<Record<keyof CustomerData, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateCustomer(customer: CustomerData): CustomerErrors {
  const errors: CustomerErrors = {};

  if (customer.name.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.name = "Escribe tu nombre y apellido.";
  }
  if (!customer.rut.trim()) {
    errors.rut = "Ingresa tu RUT.";
  }
  if (!customer.phone.trim()) {
    errors.phone = "Ingresa tu celular.";
  }
  if (customer.email.trim() && !EMAIL.test(customer.email.trim())) {
    errors.email = "Revisa el correo, el formato no es válido.";
  }

  return errors;
}
