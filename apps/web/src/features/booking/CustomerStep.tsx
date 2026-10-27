import { useState, type FormEvent } from "react";
import { Alert } from "../../components/Alert";
import { Field } from "../../components/Field";
import { formatLongDate, formatPhone } from "../../lib/format";
import { formatRut } from "../../lib/rut";
import { SHOP } from "../../lib/shop";
import type { CustomerData } from "../../types";
import { StepFrame } from "./StepFrame";
import { validateCustomer, type CustomerErrors } from "./validateCustomer";

interface CustomerStepProps {
  customer: CustomerData;
  date: string;
  time: string;
  totalClp: number;
  submitting: boolean;
  submitError: string | null;
  serverErrors: CustomerErrors;
  onChange: (customer: Partial<CustomerData>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const FORM_ID = "customer-form";

export function CustomerStep({
  customer,
  date,
  time,
  totalClp,
  submitting,
  submitError,
  serverErrors,
  onChange,
  onBack,
  onSubmit
}: CustomerStepProps) {
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const visibleErrors = { ...serverErrors, ...errors };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateCustomer(customer);
    setErrors(found);
    setConsentError(!consent);
    if (Object.keys(found).length === 0 && consent) onSubmit();
  }

  function clearError(field: keyof CustomerData) {
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  }

  return (
    <StepFrame
      title="Tus datos"
      description={`Tu hora: ${formatLongDate(date).toLowerCase()} a las ${time} h. Con tu RUT y el código de reserva podrás revisarla o cancelarla.`}
      primaryLabel="Confirmar reserva"
      primaryLoading={submitting}
      formId={FORM_ID}
      onBack={onBack}
      totalClp={totalClp}
    >
      {submitError && <Alert>{submitError}</Alert>}

      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="grid max-w-xl gap-5">
        <Field
          label="Nombre y apellido"
          name="name"
          autoComplete="name"
          value={customer.name}
          error={visibleErrors.name}
          onChange={(event) => {
            onChange({ name: event.target.value });
            clearError("name");
          }}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="RUT"
            name="rut"
            inputMode="text"
            placeholder="12.345.678-9"
            value={customer.rut}
            error={visibleErrors.rut}
            onChange={(event) => {
              onChange({ rut: formatRut(event.target.value) });
              clearError("rut");
            }}
          />
          <Field
            label="Celular"
            name="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="9 1234 5678"
            hint="Te avisamos si hay cambios en tu hora."
            value={customer.phone}
            error={visibleErrors.phone}
            onChange={(event) => {
              onChange({ phone: formatPhone(event.target.value) });
              clearError("phone");
            }}
          />
        </div>
        <Field
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          optional
          value={customer.email}
          error={visibleErrors.email}
          onChange={(event) => {
            onChange({ email: event.target.value });
            clearError("email");
          }}
        />

        <div className="grid gap-2">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              aria-invalid={consentError || undefined}
              aria-describedby={consentError ? "consent-error" : undefined}
              onChange={(event) => {
                setConsent(event.target.checked);
                setConsentError(false);
              }}
              className="mt-0.5 size-5 shrink-0 accent-barbicide"
            />
            <span>
              Acepto que {SHOP.name} use mis datos solo para gestionar esta reserva. No se comparten con terceros
              y puedo pedir su eliminación cuando quiera.
            </span>
          </label>
          {consentError && (
            <p id="consent-error" className="text-sm font-medium text-danger">
              Necesitamos tu autorización para guardar la reserva.
            </p>
          )}
        </div>

        <p className="text-sm text-steel">
          Puedes cancelar sin costo hasta {SHOP.cancellationHours} horas antes desde Mi reserva.
        </p>
      </form>
    </StepFrame>
  );
}
