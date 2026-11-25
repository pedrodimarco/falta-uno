import { useRef, useState } from "react";
import { Link } from "react-router-dom";

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
            <Link to="/ingresar">Entrar</Link>
            <Link
              className="btn btn-outline nav-create"
              to="/ingresar?volver=%2Fpartidos%2Fnuevo"
            >
              Organizar un partido
            </Link>
          </nav>
        </div>
      </header>
      <main id="contenido">
        <section className="hero">
          <div className="container">
            <div className="hero-split">
              <div className="hero-copy">
                <p className="kicker">EL DEPORTE EMPIEZA CON TU GENTE</p>
                <h1>
                  Menos mensajes.
                  <br />
                  Más partido.
                </h1>
                <p className="lead">
                  Poné fecha al encuentro, compartí el enlace y tené claro quién
                  juega. El grupo sigue siendo el mismo. La forma de
                  organizarse, cambia.
                </p>
                <div className="hero-actions">
                  <Link
                    className="btn btn-primary"
                    to="/ingresar?volver=%2Fpartidos%2Fnuevo"
                  >
                    Organizar un partido
                  </Link>
                  <a className="text-link" href="#como-funciona">
                    Así funciona
                  </a>
                </div>
                <p className="hero-note">
                  Para partidos entre amigos. Para volver a jugar.
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
                  Un enlace.
                  <br />
                  El partido en orden.
                </h2>
              </div>
              <p>
                No hace falta perderse entre mensajes para saber a qué hora se
                juega o cuántos faltan. Los detalles y las confirmaciones tienen
                su lugar.
              </p>
            </div>
            <div className="grid-3">
              <article className="process-item">
                <h3>Ponele fecha.</h3>
                <p>
                  Elegí el deporte, la cancha, la hora y los cupos. Agregá el
                  costo y lo que conviene llevar.
                </p>
                <span className="process-detail">
                  Un encuentro con los detalles claros.
                </span>
              </article>
              <article className="process-item">
                <h3>Pasá el enlace.</h3>
                <p>
                  Compartilo con tu grupo. Cada persona abre la invitación y
                  confirma si va a jugar.
                </p>
                <span className="process-detail">
                  Tu gente, invitada por vos.
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
                  Sí. El acceso es por correo mediante un enlace de un solo uso,
                  sin contraseña. Podés consultar el detalle de un partido desde
                  la invitación antes de entrar.
                </p>
              </details>
              <details>
                <summary>¿Cómo encuentro el partido de mis amigos?</summary>
                <p>
                  Abrí el enlace que compartió quien organiza. Una vez que
                  participás, el encuentro aparece en Mis partidos. El acceso
                  actual funciona por invitación.
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
        <section className="closing">
          <div className="container">
            <div className="closing-inner">
              <div>
                <p className="kicker">LA PRÓXIMA ES CON TU GENTE</p>
                <h2>
                  Vos poné la fecha.
                  <br />
                  Que empiece el partido.
                </h2>
              </div>
              <div>
                <Link
                  className="btn btn-primary"
                  to="/ingresar?volver=%2Fpartidos%2Fnuevo"
                >
                  Organizar un partido
                </Link>
                <Link className="text-link" to="/ingresar">
                  Entrar a mi cuenta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="pagefoot">
        <div className="container row-between">
          <Link className="brand" to="/" aria-label="Falta uno, inicio">
            <span className="brand-symbol" aria-hidden="true">
              <i></i>
            </span>
            <span>falta uno.</span>
          </Link>
          <p>Menos mensajes. Más juego.</p>
          <Link className="text-link" to="/ingresar">
            Entrar a mi cuenta
          </Link>
        </div>
      </footer>
    </div>
  );
}
