
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { PublicProfileMenu } from "./PublicPageLayout";

function About({ user, onLogout, onSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="about-page">
      <style>{`
        .about-page {
          --primary: #167C72;
          --primary-dark: #115F57;
          --deep-teal: #174A45;
          --gold: #D6A84F;
          --gold-dark: #A47B2D;
          --gold-light: #F5E9C9;
          --text: #263B39;
          --muted: #687B77;
          --background: #FAFAF6;
          --mint: #EAF4F1;

          color: var(--text);
          font-family: "DM Sans", "Manrope", Arial, sans-serif;
          background:
            radial-gradient(ellipse at 8% 10%, rgba(234, 244, 241, .85), transparent 35%),
            radial-gradient(ellipse at 95% 35%, rgba(245, 233, 201, .3), transparent 32%),
            var(--background);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .about-page * {
          box-sizing: border-box;
        }

        .about-nav {
          min-height: 76px;
          padding: 0 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          background: rgba(250, 250, 246, .86);
          border-bottom: 1px solid rgba(22, 124, 114, .14);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 5px 20px rgba(23, 74, 69, .035);
        }

        .about-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--deep-teal);
          font-size: 23px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: -.8px;
          flex-shrink: 0;
        }

        .about-logo-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1.1;
        }

        .about-logo-tagline {
          color: var(--gold-dark);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .65px;
          line-height: 1.2;
        }

        .about-logo-mark {
          position: relative;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, var(--primary), var(--deep-teal));
          color: white;
          border: 1.5px solid rgba(214, 168, 79, .85);
          border-radius: 12px;
          font-size: 20px;
          box-shadow:
            0 5px 14px rgba(22, 124, 114, .2),
            0 0 10px rgba(214, 168, 79, .12);
        }

        .about-nav-links {
          display: flex;
          align-items: center;
          gap: 21px;
        }

        .about-nav-links a {
          position: relative;
          color: #526762;
          font-size: 13px;
          font-weight: 650;
          text-decoration: none;
          white-space: nowrap;
          transition: color .2s ease;
        }

        .about-nav-links a::after {
          content: "";
          position: absolute;
          left: 0;
          right: 100%;
          bottom: -8px;
          height: 2px;
          border-radius: 5px;
          background: linear-gradient(90deg, var(--primary), var(--gold));
          transition: right .2s ease;
        }

        .about-nav-links a:hover,
        .about-nav-links a.active {
          color: var(--primary);
        }

        .about-nav-links a.active::after,
        .about-nav-links a:hover::after {
          right: 0;
        }

        .about-nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-shrink: 0;
        }

        .about-login {
          color: var(--deep-teal);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: color .2s ease;
        }

        .about-login:hover {
          color: var(--gold-dark);
        }

        .about-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 12px 21px;
          border-radius: 11px;
          background: linear-gradient(115deg, var(--primary), var(--deep-teal));
          color: white;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
          border: 1px solid rgba(214, 168, 79, .65);
          box-shadow: 0 5px 15px rgba(22, 124, 114, .16);
          transition:
            background .2s ease,
            transform .2s ease,
            box-shadow .2s ease;
          cursor: pointer;
        }

        .about-button:hover {
          background: linear-gradient(115deg, var(--primary-dark), var(--deep-teal));
          transform: translateY(-2px);
          box-shadow:
            0 8px 20px rgba(22, 124, 114, .2),
            0 0 15px rgba(214, 168, 79, .18);
        }

        .about-button:focus-visible,
        .about-menu-toggle:focus-visible,
        .about-nav a:focus-visible,
        .about-footer a:focus-visible {
          outline: 3px solid rgba(214, 168, 79, .7);
          outline-offset: 4px;
        }

        .about-menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(22, 124, 114, .2);
          border-radius: 11px;
          background: rgba(255, 255, 255, .85);
          color: var(--deep-teal);
          font-size: 23px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: border-color .2s, background .2s;
        }

        .about-menu-toggle:hover {
          border-color: var(--gold);
          background: var(--mint);
        }

        .about-hero {
          position: relative;
          padding: 105px 7% 95px;
          text-align: center;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(214, 168, 79, .2), transparent 50%),
            radial-gradient(ellipse at 12% 55%, rgba(22, 124, 114, .12), transparent 40%),
            linear-gradient(180deg, rgba(255, 255, 255, .7), rgba(234, 244, 241, .62));
          border-bottom: 1px solid rgba(22, 124, 114, .1);
        }

        .about-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 15px;
          border: 1px solid rgba(214, 168, 79, .58);
          background: rgba(245, 233, 201, .62);
          border-radius: 30px;
          color: var(--gold-dark);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .8px;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 4px 13px rgba(214, 168, 79, .08);
        }

        .about-hero h1 {
          max-width: 850px;
          margin: 26px auto 19px;
          color: var(--deep-teal);
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1.15;
          letter-spacing: -2px;
          font-weight: 850;
        }

        .about-highlight {
          color: var(--primary);
          background: linear-gradient(100deg, var(--primary), var(--gold-dark));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .about-hero p {
          max-width: 700px;
          margin: 0 auto;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.85;
        }

        .about-section {
          padding: 85px 7%;
        }

        .about-white {
          background: rgba(255, 255, 255, .57);
          border-top: 1px solid rgba(22, 124, 114, .08);
          border-bottom: 1px solid rgba(22, 124, 114, .08);
        }

        .about-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .about-story {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          gap: 55px;
        }

        .about-story h2 {
          margin: 19px 0;
          color: var(--deep-teal);
          font-size: 32px;
          letter-spacing: -1px;
          line-height: 1.3;
        }

        .about-story p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.9;
          margin: 0 0 15px;
        }

        .about-visual {
          position: relative;
          min-height: 310px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(214, 168, 79, .48);
          border-radius: 25px;
          background:
            radial-gradient(circle at 50% 50%, rgba(245, 233, 201, .58), transparent 55%),
            linear-gradient(135deg, rgba(234, 244, 241, .94), rgba(255, 255, 255, .88));
          backdrop-filter: blur(17px);
          -webkit-backdrop-filter: blur(17px);
          box-shadow:
            0 15px 40px rgba(23, 74, 69, .08),
            inset 0 1px 0 rgba(255, 255, 255, .9);
        }

        .about-visual::before,
        .about-visual::after {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          border: 1px solid rgba(214, 168, 79, .32);
          border-radius: 50%;
        }

        .about-visual::before {
          top: -75px;
          right: -45px;
        }

        .about-visual::after {
          bottom: -95px;
          left: -55px;
          width: 220px;
          height: 220px;
        }

        .about-visual-icon {
          position: relative;
          z-index: 1;
          width: 132px;
          height: 132px;
          display: grid;
          place-items: center;
          border: 2px solid rgba(214, 168, 79, .85);
          border-radius: 34px;
          background: linear-gradient(145deg, var(--primary), var(--deep-teal));
          color: white;
          font-size: 65px;
          box-shadow:
            0 20px 45px rgba(22, 124, 114, .2),
            0 0 30px rgba(214, 168, 79, .17);
          transition: transform .3s ease;
        }

        .about-visual:hover .about-visual-icon {
          transform: translateY(-4px) scale(1.03);
        }

        .about-heading {
          max-width: 680px;
          margin: 0 auto 45px;
          text-align: center;
        }

        .about-heading span {
          color: var(--gold-dark);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .about-heading h2 {
          margin: 13px 0;
          color: var(--deep-teal);
          font-size: clamp(28px, 4vw, 39px);
          letter-spacing: -1px;
        }

        .about-heading p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.8;
        }

        .about-values {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .about-value-card {
          position: relative;
          overflow: hidden;
          padding: 29px;
          border: 1px solid rgba(22, 124, 114, .16);
          border-radius: 20px;
          background: linear-gradient(
            140deg,
            rgba(255, 255, 255, .88),
            rgba(234, 244, 241, .62)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 9px 27px rgba(23, 74, 69, .06);
          transition:
            transform .28s ease,
            border-color .28s ease,
            box-shadow .28s ease,
            background .28s ease;
        }

        .about-value-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), var(--gold));
          border-radius: 0 0 4px 0;
          transition: width .28s ease;
        }

        .about-value-card:hover {
          transform: translateY(-6px);
          border-color: rgba(214, 168, 79, .62);
          background: rgba(255, 255, 255, .96);
          box-shadow:
            0 16px 35px rgba(23, 74, 69, .1),
            0 0 19px rgba(214, 168, 79, .1);
        }

        .about-value-card:hover::before {
          width: 90px;
        }

        .about-value-icon {
          width: 49px;
          height: 49px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214, 168, 79, .48);
          border-radius: 14px;
          background: linear-gradient(145deg, var(--mint), rgba(245, 233, 201, .8));
          font-size: 23px;
          box-shadow: 0 4px 12px rgba(214, 168, 79, .08);
        }

        .about-value-card h3 {
          margin: 19px 0 10px;
          color: var(--deep-teal);
          font-size: 18px;
        }

        .about-value-card p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.85;
        }

        .about-commitment {
          position: relative;
          overflow: hidden;
          padding: 52px 45px;
          border: 1px solid rgba(214, 168, 79, .52);
          border-radius: 24px;
          background:
            radial-gradient(ellipse at 100% 0%, rgba(245, 233, 201, .62), transparent 45%),
            linear-gradient(120deg, rgba(234, 244, 241, .94), rgba(255, 255, 255, .88));
          backdrop-filter: blur(17px);
          -webkit-backdrop-filter: blur(17px);
          text-align: center;
          box-shadow: 0 12px 35px rgba(23, 74, 69, .07);
        }

        .about-commitment h2 {
          margin: 20px 0 14px;
          color: var(--deep-teal);
          font-size: 30px;
          letter-spacing: -.8px;
        }

        .about-commitment p {
          max-width: 720px;
          margin: 0 auto 25px;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.9;
        }

        .about-cta {
          position: relative;
          overflow: hidden;
          padding: 82px 7%;
          text-align: center;
          background:
            radial-gradient(ellipse at 15% 0%, rgba(214, 168, 79, .24), transparent 42%),
            radial-gradient(ellipse at 90% 100%, rgba(22, 124, 114, .12), transparent 40%),
            linear-gradient(120deg, #EAF4F1, #F8F8F1 55%, #F5E9C9);
          border-top: 1px solid rgba(214, 168, 79, .32);
          border-bottom: 1px solid rgba(22, 124, 114, .14);
          color: var(--deep-teal);
        }

        .about-cta h2 {
          margin: 0 0 15px;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -.8px;
        }

        .about-cta p {
          max-width: 580px;
          margin: 0 auto 27px;
          color: #526762;
          font-size: 15px;
          line-height: 1.8;
        }

        .about-footer {
          padding: 35px 7% 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          background: rgba(250, 250, 246, .96);
          border-top: 1px solid rgba(22, 124, 114, .14);
          color: var(--muted);
        }

        .about-footer .about-logo {
          color: var(--deep-teal);
          font-size: 19px;
        }

        .about-footer .about-logo-mark {
          width: 32px;
          height: 32px;
          font-size: 17px;
          border-radius: 10px;
        }

        .about-footer .about-logo-tagline {
          font-size: 8px;
        }

        .about-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
        }

        .about-footer-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 13px;
          transition: color .2s ease;
        }

        .about-footer-links a:hover {
          color: var(--primary);
        }

        .about-footer-links a[aria-current="page"] {
          color: var(--primary);
          font-weight: 750;
        }

        .about-copyright {
          width: 100%;
          padding-top: 18px;
          border-top: 1px solid rgba(22, 124, 114, .13);
          font-size: 12px;
          text-align: center;
          color: #7B8B86;
        }

        @media (max-width: 1100px) {
          .about-nav {
            padding: 0 4%;
            gap: 12px;
          }

          .about-nav-links {
            gap: 12px;
          }

          .about-nav-links a {
            font-size: 12px;
          }

          .about-nav-actions {
            gap: 12px;
          }
        }

        @media (max-width: 850px) {
          .about-section {
            padding: 65px 5%;
          }

          .about-story {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .about-visual {
            min-height: 270px;
          }

          .about-values {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .about-nav {
            min-height: 70px;
            padding: 12px 5%;
            flex-wrap: wrap;
            gap: 0;
          }

          .about-logo {
            font-size: 20px;
          }

          .about-menu-toggle {
            display: flex;
          }

          .about-nav-links,
          .about-nav-actions {
            display: none;
            width: 100%;
          }

          .about-nav.menu-open .about-nav-links {
            display: flex;
            order: 3;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: 12px 0;
            border-top: 1px solid rgba(22, 124, 114, .13);
            margin-top: 12px;
          }

          .about-nav.menu-open .about-nav-links a {
            padding: 12px 10px;
            font-size: 14px;
            border-radius: 8px;
          }

          .about-nav.menu-open .about-nav-links a::after {
            display: none;
          }

          .about-nav.menu-open .about-nav-links a.active {
            color: var(--primary);
            background: var(--mint);
            border-left: 3px solid var(--gold);
            padding-left: 12px;
          }

          .about-nav.menu-open .about-nav-actions {
            display: flex;
            order: 4;
            padding: 12px 0 5px;
            border-top: 1px solid rgba(22, 124, 114, .13);
          }

          .about-nav-actions .about-button {
            padding: 10px 13px;
          }
        }

        @media (max-width: 700px) {
          .about-hero {
            padding: 72px 6%;
          }

          .about-hero h1 {
            letter-spacing: -1.3px;
          }

          .about-hero p {
            font-size: 15px;
          }

          .about-values {
            grid-template-columns: 1fr;
          }

          .about-commitment {
            padding: 34px 22px;
          }

          .about-commitment h2 {
            font-size: 26px;
          }

          .about-cta {
            padding: 65px 6%;
          }

          .about-footer {
            justify-content: center;
            text-align: center;
          }

          .about-footer-links {
            justify-content: center;
            gap: 15px 20px;
          }
        }

        @media (max-width: 380px) {
          .about-logo {
            font-size: 18px;
          }

          .about-logo-mark {
            width: 34px;
            height: 34px;
          }

          .about-hero h1 {
            font-size: 35px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-page *,
          .about-page *::before,
          .about-page *::after {
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
          }

          .about-value-card:hover,
          .about-button:hover,
          .about-visual:hover .about-visual-icon {
            transform: none;
          }
        }
      `}</style>

      <header className={`about-nav ${menuOpen ? "menu-open" : ""}`}>
        <Link to="/home" className="about-logo" onClick={closeMenu}>
          <span className="about-logo-mark">D</span>
          <span className="about-logo-copy">
            <span>DocuFortis</span>
            <span className="about-logo-tagline">by Code Syndicate</span>
          </span>
        </Link>

        <nav className="about-nav-links" aria-label="Main navigation">
          <Link to="/home" onClick={closeMenu}>Home</Link>
          <Link to="/about" className="active" onClick={closeMenu}>About</Link>
          <Link to="/features" onClick={closeMenu}>Features</Link>
          <Link to="/how-it-works" onClick={closeMenu}>How It Works</Link>
          <Link to="/security" onClick={closeMenu}>Security</Link>
          <Link to="/plans" onClick={closeMenu}>Plans</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/faq" onClick={closeMenu}>FAQ</Link>
        </nav>

        <div className="about-nav-actions">
          {user ? (
            <PublicProfileMenu
              user={user}
              onLogout={onLogout}
              onSettings={onSettings}
              onCloseMenu={closeMenu}
            />
          ) : (
            <>
              <Link to="/login" className="about-login" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="about-button" onClick={closeMenu}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="about-menu-toggle"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="about-navigation"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      <main>
        <section className="about-hero">
          <span className="about-eyebrow">About DocuFortis</span>
          <h1>
            Making document management
            <br />
            <span className="about-highlight">
              more secure and controlled.
            </span>
          </h1>
          <p>
            DocuFortis is a security-focused document management and sharing
            platform designed to give users greater control over their files,
            account access, and document-sharing activities.
          </p>
        </section>

        <section className="about-section about-white">
          <div className="about-container about-story">
            <div>
              <span className="about-eyebrow">Our Platform</span>
              <h2>A better way to manage and share documents.</h2>
              <p>
                Documents often contain information that deserves careful
                handling. Managing those files and deciding who can access
                them should be straightforward and transparent.
              </p>
              <p>
                DocuFortis brings document storage, file management, and
                controlled sharing together in one workspace. Users can
                manage their documents while setting permissions and
                restrictions for shared access.
              </p>
              <p>
                The platform also incorporates account-protection mechanisms
                and activity records to support a more security-conscious
                document workflow.
              </p>
            </div>

            <div className="about-visual">
              <div className="about-visual-icon" aria-hidden="true">🛡️</div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-heading">
            <span>What Guides Us</span>
            <h2>Built around three important principles</h2>
            <p>
              Our approach focuses on making document management practical
              while keeping access and security considerations in mind.
            </p>
          </div>

          <div className="about-container about-values">
            <article className="about-value-card">
              <div className="about-value-icon">🔐</div>
              <h3>Security Awareness</h3>
              <p>
                Account protection, multi-factor authentication, and
                security-focused controls help users protect access to
                their workspace.
              </p>
            </article>

            <article className="about-value-card">
              <div className="about-value-icon">🎯</div>
              <h3>User Control</h3>
              <p>
                Sharing permissions, recipient restrictions, expiration
                settings, and revocation options put access decisions
                in the user's hands.
              </p>
            </article>

            <article className="about-value-card">
              <div className="about-value-icon">📂</div>
              <h3>Simplicity</h3>
              <p>
                Document storage, previewing, downloading, and sharing
                are brought together in one accessible workspace.
              </p>
            </article>
          </div>
        </section>

        <section className="about-section about-white">
          <div className="about-container">
            <div className="about-commitment">
              <span className="about-eyebrow">Our Approach</span>
              <h2>Security should be part of the workflow.</h2>
              <p>
                DocuFortis is designed around the idea that document
                management and access control should work together.
                From account authentication to document sharing and
                activity tracking, the platform aims to make important
                security considerations part of everyday file management.
              </p>
              <Link to="/register" className="about-button">
                Explore DocuFortis →
              </Link>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <h2>Your documents deserve greater control.</h2>
          <p>
            Explore DocuFortis and manage your documents with a more
            organized, security-conscious approach.
          </p>
          <Link to="/register" className="about-button">
            Create Your Account →
          </Link>
        </section>
      </main>

      <footer className="about-footer">
        <Link to="/home" className="about-logo">
          <span className="about-logo-mark">D</span>
          <span className="about-logo-copy">
            <span>DocuFortis</span>
            <span className="about-logo-tagline">by Code Syndicate</span>
          </span>
        </Link>

        <div className="about-footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>

        <div className="about-copyright">
          © {new Date().getFullYear()} DocuFortis. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default About;
