import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionAttempted(true);
  }

  return (
    <form
      className="contact-form"
      aria-label="Contacto"
      aria-describedby="contact-availability"
      onSubmit={handleSubmit}
      onChange={() => setSubmissionAttempted(false)}
    >
      <div className="contact-fields">
        <label htmlFor="contact-name">
          Nombre
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            placeholder="Tu nombre"
          />
        </label>
        <label htmlFor="contact-email">
          Email
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="vos@ejemplo.com"
          />
        </label>
      </div>
      <label htmlFor="contact-message">
        Mensaje
        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={2000}
          rows={5}
          placeholder="Contanos en qué te podemos ayudar"
        />
      </label>
      <p id="contact-availability" className="contact-note">
        Estamos preparando este canal de contacto. Por ahora, los mensajes no se
        envían.
      </p>
      <button className="btn btn-primary" type="submit">
        Enviar mensaje
      </button>
      <p className="contact-feedback" role="status">
        {submissionAttempted &&
          "El envío todavía no está habilitado. Tu mensaje no se envió y sigue en el formulario."}
      </p>
    </form>
  );
}
