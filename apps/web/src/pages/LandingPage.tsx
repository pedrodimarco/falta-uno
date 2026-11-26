import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ContactForm } from "../features/landing/components/ContactForm";

/** Promotional page. The attendance example never changes real match data. */
export function LandingPage() {
  const [joined, setJoined] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <div className="landing-page">
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header
        className="topnav"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className="container topnav-inner">
          <Link className="brand" to="/" aria-label="Falta uno, inicio">
            <span className="brand-symbol" aria-hidden="true">
              <i></i>
            </span>
            <span>falta uno.</span>
          </Link>
          <button
            className="menu-toggle"
            id="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-nav"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            ref={menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <nav
            className={menuOpen ? "open" : undefined}
            onClick={() => setMenuOpen(false)}
            id="landing-nav"
            aria-label="Principal"
          >
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#preguntas">Preguntas</a>
            <a className="btn btn-outline nav-create" href="#proximamente">
              Próximamente
            </a>
          </nav>
        </div>
      </header>
      <main id="contenido">
        <section className="hero">
          <div className="container">
            <div className="hero-split">
              <div className="hero-copy">
                <p className="kicker">MÁS FORMAS DE VOLVER A JUGAR</p>
                <p className="development-badge">En desarrollo</p>
                <h1>
                  Menos mensajes.
                  <br />
                  Más partido.
                </h1>
                <p className="lead">
                  Organizá con tu grupo o encontrá un partido abierto para
                  sumarte. Público o privado: vos elegís cómo volver a jugar.
                </p>
                <div className="hero-actions">
                  <a className="btn btn-primary" href="#proximamente">
                    Próximamente
                  </a>
                  <a className="text-link" href="#como-funciona">
                    Así funciona
                  </a>
                </div>
                <p className="hero-note">
                  Estamos preparando la aplicación. El acceso público todavía no
                  está disponible.
                </p>
              </div>
              <figure className="product-figure">
                <div className="match-example">
                  <div className="pitch" aria-hidden="true">
                    <i></i>
                  </div>
                  <div className="example-head">
                    <span className="kicker">EL PRÓXIMO ENCUENTRO</span>
                    <span className="example-kind">Fútbol 5</span>
                  </div>
                  <h2>
                    El fútbol
                    <br />
                    del jueves.
                  </h2>
                  <div className="example-facts">
                    <div>
                      <strong>
                        Jueves <span className="example-time">20:00</span>
                      </strong>
                      <span>Un hueco en tu semana</span>
                    </div>
                    <div>
                      <strong>Tu cancha</strong>
                      <span>El lugar lo elige el grupo</span>
                    </div>
                  </div>
                  <div className="attendance">
                    <div className="attendance-heading">
                      <span>El equipo se está armando</span>
                      <strong className="num" id="attendance-count">
                        {joined ? "9 / 10" : "8 / 10"}
                      </strong>
                    </div>
                    <div
                      className="seats"
                      id="attendance-meter"
                      role="progressbar"
                      aria-label="Asistencia del partido de ejemplo"
                      aria-valuemin={0}
                      aria-valuemax={10}
                      aria-valuenow={joined ? 9 : 8}
                      aria-valuetext={
                        joined ? "9 confirmados de 10" : "8 confirmados de 10"
                      }
                    >
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span className="seat filled" aria-hidden="true"></span>
                      <span
                        className={joined ? "seat filled self" : "seat vacant"}
                        id="your-seat"
                        aria-hidden="true"
                      ></span>
                      <span className="seat vacant" aria-hidden="true"></span>
                    </div>
                    <p
                      className="example-availability"
                      id="attendance-status"
                      role="status"
                      aria-live="polite"
                    >
                      {joined
                        ? "Tu lugar está confirmado. Queda 1 disponible."
                        : "Quedan 2 lugares. Uno puede ser el tuyo."}
                    </p>
                  </div>
                  <button
                    className="btn btn-paper example-control"
                    id="attendance-button"
                    type="button"
                    onClick={() => setJoined(!joined)}
                  >
                    {joined ? "Liberar mi lugar" : "Confirmar mi lugar"}
                  </button>
                  <p className="interaction-hint" id="attendance-hint">
                    {joined
                      ? "Podés cancelar si cambian tus planes."
                      : "Probá confirmar tu asistencia."}
                  </p>
                </div>
                <figcaption>
                  Ejemplo interactivo de un partido. No realiza una inscripción
                  real.
                </figcaption>
              </figure>
            </div>
            <div className="sport-line">
              <p>Distintos deportes. Las mismas ganas.</p>
              <ul aria-label="Deportes">
                <li>Fútbol 5</li>
                <li>Pádel</li>
                <li>Básquet</li>
              </ul>
            </div>
          </div>
        </section>
        <section className="section" id="como-funciona">
          <div className="container">
            <div className="process-header">
              <div>
                <p className="kicker">DEL «¿JUGAMOS?» AL «NOS VEMOS»</p>
                <h2>
                  Elegí el partido.
                  <br />O armá el tuyo.
                </h2>
              </div>
              <p>
                Estamos preparando dos formas de organizar: partidos públicos
                para encontrar con quién jugar y privados para tu grupo. En
                ambos, los detalles y las confirmaciones van a tener su lugar.
              </p>
            </div>
            <div className="grid-3">
              <article className="process-item">
                <h3>Ponele fecha.</h3>
                <p>
                  Elegí el deporte, la cancha, la hora y los cupos. Agregá el
                  costo y decidí si el partido va a ser público o privado.
                </p>
                <span className="process-detail">Tu partido, a tu manera.</span>
              </article>
              <article className="process-item">
                <h3>Abrí el juego o invitá.</h3>
                <p>
                  Si es público, otras personas van a poder encontrarlo y
                  sumarse directamente si hay lugar. Si es privado, compartí la
                  invitación con tu grupo.
                </p>
                <span className="process-detail">
                  Un equipo nuevo o los de siempre.
                </span>
              </article>
              <article className="process-item">
                <h3>Tené claro quién viene.</h3>
                <p>
                  Consultá los confirmados y los lugares disponibles. Si alguien
                  cancela, el cupo vuelve a gestionarse.
                </p>
                <span className="process-detail">
                  Una lista que podés consultar.
                </span>
              </article>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container waiting-layout">
            <div className="waiting-copy">
              <p className="kicker">TAMBIÉN CUANDO SE COMPLETA</p>
              <h2>
                Si se libera un lugar,
                <br />
                la espera tiene orden.
              </h2>
              <p>
                Cuando el partido está completo, podés anotarte a la lista de
                espera. Si te llega una oferta, aceptás el lugar antes de que
                venza el plazo.
              </p>
              <p>Sin confundir «me interesa» con «voy a jugar».</p>
            </div>
            <div className="waiting-example">
              <div className="row-between">
                <h3>Lista de espera</h3>
                <span className="state-label">Partido completo</span>
              </div>
              <div className="waiting-person">
                <span className="person-initial" aria-hidden="true">
                  T
                </span>
                <div>
                  <strong>Tu lugar en la espera</strong>
                  <p>La oferta sigue el orden de la lista.</p>
                </div>
              </div>
              <div className="offer-example">
                <strong>Se liberó un lugar</strong>
                <p>
                  Tu asistencia queda confirmada cuando aceptás la oferta. Hasta
                  entonces, el lugar está reservado.
                </p>
              </div>
              <p className="small-print">
                Así se distinguen espera, reserva y confirmación.
              </p>
            </div>
          </div>
        </section>
        <section className="section" id="preguntas">
          <div className="container questions-layout">
            <div className="questions-heading">
              <p className="kicker">ANTES DE SALIR A JUGAR</p>
              <h2>Lo que conviene saber.</h2>
            </div>
            <div className="faq-list">
              <details>
                <summary>¿Ya puedo usar Falta uno?</summary>
                <p>
                  Todavía estamos trabajando en la aplicación y haciendo pruebas
                  antes de abrir el acceso al público. Mientras tanto, podés
                  conocer la propuesta y probar el ejemplo de esta página.
                </p>
              </details>
              <details>
                <summary>¿Falta uno reserva la cancha?</summary>
                <p>
                  No. El grupo elige y reserva la cancha por su cuenta. Falta
                  uno reúne los detalles del encuentro y las confirmaciones de
                  asistencia; tampoco procesa el pago.
                </p>
              </details>
              <details>
                <summary>¿Necesito una cuenta para confirmar?</summary>
                <p>
                  Sí. Cuando habilitemos el acceso público, vas a poder ingresar
                  por correo mediante un enlace de un solo uso, sin contraseña.
                </p>
              </details>
              <details>
                <summary>¿Cómo voy a encontrar partidos para jugar?</summary>
                <p>
                  La propuesta incluye un listado de partidos públicos abiertos.
                  Vas a poder elegir uno y confirmar tu lugar directamente si
                  quedan cupos, sin esperar a que te compartan un enlace.
                </p>
                <p>
                  También va a haber partidos privados: se comparten por
                  invitación y no aparecen en ese listado. Al organizar, vas a
                  poder elegir entre las dos opciones. Estamos trabajando en
                  estas funciones.
                </p>
              </details>
              <details>
                <summary>¿Qué pasa si al final no puedo ir?</summary>
                <p>
                  Podés cancelar tu asistencia antes de que empiece el partido.
                  Si hay personas en espera, el lugar se ofrece según el orden
                  de la lista.
                </p>
              </details>
            </div>
          </div>
        </section>
        <section
          className="closing"
          id="proximamente"
          aria-labelledby="coming-soon-title"
        >
          <div className="container">
            <div className="closing-inner">
              <div>
                <p className="kicker">PRÓXIMAMENTE</p>
                <h2 id="coming-soon-title" tabIndex={-1}>
                  Estamos preparando
                  <br />
                  el próximo partido.
                </h2>
                <p className="coming-soon-note">
                  Falta uno está en desarrollo. Estamos trabajando para que
                  organizar y volver a jugar sea cada vez más simple.
                </p>
              </div>
              <div>
                <a className="btn btn-primary" href="#como-funciona">
                  Conocé la propuesta
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="pagefoot">
        <div className="container contact-layout" id="contacto">
          <div className="contact-copy">
            <p className="kicker">SEGUIMOS EN CONTACTO</p>
            <h2>¿Charlamos?</h2>
            <p>
              ¿Tenés una pregunta o una idea para Falta uno? Nos interesa saber
              cómo podemos ayudarte a volver a jugar.
            </p>
          </div>
          <ContactForm />
        </div>
        <div className="container row-between">
          <Link className="brand" to="/" aria-label="Falta uno, inicio">
            <span className="brand-symbol" aria-hidden="true">
              <i></i>
            </span>
            <span>falta uno.</span>
          </Link>
          <p>Menos mensajes. Más juego.</p>
          <a className="text-link" href="#contacto">
            Contacto
          </a>
        </div>
      </footer>
    </div>
  );
}
