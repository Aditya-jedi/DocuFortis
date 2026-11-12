
import { useCallback, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export function PublicProfileMenu({
  user,
  onLogout,
  onSettings,
  onCloseMenu,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const userName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "User";

  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        if (onCloseMenu) {
          onCloseMenu();
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onCloseMenu]);

  const closeMenus = () => {
    setProfileOpen(false);
    if (onCloseMenu) {
      onCloseMenu();
    }
  };

  const handleLogout = () => {
    closeMenus();
    if (onLogout) {
      onLogout();
    }
  };

  const handleSettings = () => {
    closeMenus();
    if (onSettings) {
      onSettings();
    }
  };

  return (
    <div className="public-profile-wrapper" ref={profileRef}>
      <style>{`
        .public-profile-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .public-profile-trigger {
          width: 40px;
          height: 40px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(214, 168, 79, .85);
          border-radius: 50%;
          background: linear-gradient(145deg, var(--primary), var(--deep-teal));
          color: white;
          font-family: "Manrope", sans-serif;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 4px 12px rgba(22, 124, 114, .18),
            0 0 10px rgba(214, 168, 79, .12);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .public-profile-trigger:hover {
          transform: translateY(-2px);
          box-shadow:
            0 7px 17px rgba(22, 124, 114, .22),
            0 0 13px rgba(214, 168, 79, .2);
        }

        .public-profile-trigger[aria-expanded="true"] {
          outline: 3px solid rgba(214, 168, 79, .2);
          outline-offset: 3px;
        }

        .public-profile-dropdown {
          position: absolute;
          top: calc(100% + 13px);
          right: 0;
          z-index: 200;
          width: 205px;
          padding: 9px;
          border: 1px solid rgba(214, 168, 79, .42);
          border-radius: 15px;
          background: rgba(255, 255, 255, .96);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 14px 35px rgba(23, 74, 69, .14);
          animation: public-dropdown-in .18s ease-out;
        }

        @keyframes public-dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .public-profile-heading {
          padding: 9px 11px 12px;
          border-bottom: 1px solid rgba(22, 124, 114, .12);
          margin-bottom: 6px;
          overflow: hidden;
        }

        .public-profile-name {
          display: block;
          color: var(--deep-teal);
          font-size: 13px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .public-profile-label {
          display: block;
          margin-top: 3px;
          color: var(--muted);
          font-size: 11px;
        }

        .public-profile-item {
          width: 100%;
          min-height: 39px;
          padding: 9px 11px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #526762;
          font-family: inherit;
          font-size: 13px;
          font-weight: 650;
          text-align: left;
          text-decoration: none;
          cursor: pointer;
          transition: background .18s ease, color .18s ease;
        }

        .public-profile-item:hover {
          background: var(--mint);
          color: var(--primary-dark);
        }

        .public-profile-item.logout {
          color: #A34D43;
        }

        .public-profile-item.logout:hover {
          background: #FBEEEB;
          color: #923B32;
        }

        .public-profile-item span:first-child {
          width: 17px;
          text-align: center;
          font-size: 15px;
        }
      `}</style>

      <button
        type="button"
        className="public-profile-trigger"
        onClick={() => setProfileOpen((previous) => !previous)}
        aria-label="Open account menu"
        aria-expanded={profileOpen}
        title={userName}
      >
        {userInitial}
      </button>

      {profileOpen && (
        <div className="public-profile-dropdown">
          <div className="public-profile-heading">
            <span className="public-profile-name">{userName}</span>
            <span className="public-profile-label">My Account</span>
          </div>

          <Link
            to="/"
            className="public-profile-item"
            onClick={closeMenus}
          >
            <span aria-hidden="true">▦</span>
            Dashboard
          </Link>

          <button
            type="button"
            className="public-profile-item"
            onClick={handleSettings}
          >
            <span aria-hidden="true">⚙</span>
            Settings
          </button>

          <button
            type="button"
            className="public-profile-item logout"
            onClick={handleLogout}
          >
            <span aria-hidden="true">↪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function PublicPageLayout({
  activePage,
  eyebrow,
  title,
  description,
  children,
  user,
  onLogout,
  onSettings,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: "Home", to: "/home", key: "home" },
    { label: "About", to: "/about", key: "about" },
    { label: "Features", to: "/features", key: "features" },
    { label: "How It Works", to: "/how-it-works", key: "how-it-works" },
    { label: "Security", to: "/security", key: "security" },
    { label: "Plans", to: "/plans", key: "plans" },
    { label: "Contact", to: "/contact", key: "contact" },
    { label: "FAQ", to: "/faq", key: "faq" },
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="public-page">
      <style>{`
        .public-page {
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
            radial-gradient(ellipse at 8% 12%, rgba(214, 168, 79, .09), transparent 35%),
            radial-gradient(ellipse at 92% 45%, rgba(22, 124, 114, .075), transparent 38%),
            linear-gradient(145deg, #FAFAF6, #F6F8F2);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .public-page *,
        .public-page *::before,
        .public-page *::after {
          box-sizing: border-box;
        }

        .public-nav {
          min-height: 76px;
          padding: 0 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          background: rgba(250, 250, 246, .82);
          border-bottom: 1px solid rgba(22, 124, 114, .15);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 5px 25px rgba(23, 74, 69, .045);
        }

        .public-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--deep-teal);
          font-size: 22px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: -.8px;
          flex-shrink: 0;
          transition: transform .25s ease;
        }

        .public-logo:hover {
          transform: translateY(-1px);
        }

        .public-logo-mark {
          position: relative;
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          background: linear-gradient(140deg, var(--primary), var(--deep-teal));
          color: white;
          border: 1px solid rgba(214, 168, 79, .8);
          border-radius: 12px;
          font-family: "Manrope", sans-serif;
          font-size: 20px;
          font-weight: 850;
          box-shadow:
            0 5px 15px rgba(22, 124, 114, .2),
            0 0 12px rgba(214, 168, 79, .1);
          flex-shrink: 0;
        }

        .public-logo-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          line-height: 1.1;
        }

        .public-logo-name {
          color: var(--deep-teal);
          font-size: inherit;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .public-logo-tagline {
          color: var(--gold-dark);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .65px;
          line-height: 1.2;
        }

        .public-nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .public-nav-links a {
          position: relative;
          color: #60736F;
          font-size: 13px;
          font-weight: 650;
          text-decoration: none;
          white-space: nowrap;
          transition: color .2s ease;
        }

        .public-nav-links a::after {
          content: "";
          position: absolute;
          height: 2px;
          left: 0;
          right: 100%;
          bottom: -10px;
          background: linear-gradient(90deg, var(--primary), var(--gold));
          border-radius: 5px;
          transition: right .2s ease;
        }

        .public-nav-links a:hover,
        .public-nav-links a.active {
          color: var(--primary);
        }

        .public-nav-links a:hover::after,
        .public-nav-links a.active::after {
          right: 0;
        }

        .public-nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-shrink: 0;
        }

        .public-login {
          color: var(--deep-teal);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: color .2s ease;
        }

        .public-login:hover {
          color: var(--gold-dark);
        }

        .public-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 12px 21px;
          border-radius: 11px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
          border: 1px solid rgba(214, 168, 79, .65);
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(22, 124, 114, .18);
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .public-button:hover {
          transform: translateY(-2px);
          border-color: var(--gold);
          box-shadow:
            0 9px 22px rgba(22, 124, 114, .22),
            0 0 0 3px rgba(214, 168, 79, .12);
        }

        .public-menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(22, 124, 114, .2);
          border-radius: 11px;
          background: rgba(255, 255, 255, .82);
          color: var(--deep-teal);
          font-size: 22px;
          cursor: pointer;
          transition:
            background .2s ease,
            border-color .2s ease;
        }

        .public-menu-toggle:hover {
          background: var(--mint);
          border-color: var(--gold);
        }

        .public-hero {
          position: relative;
          padding: 92px 7% 82px;
          text-align: center;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(22, 124, 114, .13), transparent 62%),
            radial-gradient(ellipse at 82% 25%, rgba(214, 168, 79, .15), transparent 38%),
            linear-gradient(180deg, rgba(255, 255, 255, .7), rgba(234, 244, 241, .5));
          border-bottom: 1px solid rgba(22, 124, 114, .1);
        }

        .public-hero::after {
          content: "";
          display: block;
          width: 70px;
          height: 3px;
          margin: 28px auto 0;
          border-radius: 10px;
          background: linear-gradient(90deg, var(--primary), var(--gold));
          box-shadow: 0 2px 10px rgba(214, 168, 79, .2);
        }

        .public-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border: 1px solid rgba(214, 168, 79, .58);
          background: rgba(255, 255, 255, .72);
          border-radius: 30px;
          color: var(--gold-dark);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(23, 74, 69, .05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .public-hero h1 {
          max-width: 850px;
          margin: 24px auto 18px;
          font-family: "Manrope", sans-serif;
          font-size: clamp(34px, 5vw, 53px);
          line-height: 1.16;
          letter-spacing: -1.9px;
          font-weight: 850;
          color: var(--deep-teal);
        }

        .public-hero p {
          max-width: 700px;
          margin: 0 auto;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.85;
        }

        .public-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 65px 7% 90px;
        }

        .public-card {
          position: relative;
          padding: 32px;
          margin-bottom: 22px;
          border: 1px solid rgba(22, 124, 114, .16);
          border-radius: 19px;
          background: rgba(255, 255, 255, .78);
          box-shadow:
            0 8px 26px rgba(23, 74, 69, .055),
            inset 0 1px 0 rgba(255, 255, 255, .85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition:
            transform .28s ease,
            box-shadow .28s ease,
            border-color .28s ease;
        }

        .public-card:hover {
          transform: translateY(-3px);
          border-color: rgba(214, 168, 79, .58);
          box-shadow:
            0 14px 34px rgba(23, 74, 69, .085),
            0 0 0 3px rgba(214, 168, 79, .05);
        }

        .public-card h2 {
          margin: 0 0 15px;
          color: var(--deep-teal);
          font-family: "Manrope", sans-serif;
          font-size: 22px;
          letter-spacing: -.5px;
        }

        .public-card h3 {
          margin: 23px 0 10px;
          color: var(--deep-teal);
          font-size: 16px;
        }

        .public-card p,
        .public-card li {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.9;
        }

        .public-card p:last-child {
          margin-bottom: 0;
        }

        .public-card ul {
          padding-left: 22px;
        }

        .public-card li::marker {
          color: var(--gold-dark);
        }

        .public-card details,
        details.public-card {
          cursor: pointer;
        }

        details.public-card summary {
          color: var(--deep-teal);
          font-weight: 750;
          list-style: none;
          line-height: 1.6;
        }

        details.public-card summary::-webkit-details-marker {
          display: none;
        }

        details.public-card summary::after {
          content: "+";
          float: right;
          color: var(--primary);
          font-size: 22px;
          font-weight: 500;
          line-height: 1;
          transition: color .2s ease;
        }

        details.public-card[open] summary::after {
          content: "−";
          color: var(--gold-dark);
        }

        details.public-card[open] {
          border-color: rgba(214, 168, 79, .58);
        }

        .public-footer {
          padding: 42px 7% 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 25px;
          background:
            radial-gradient(ellipse at 90% 0%, rgba(214, 168, 79, .13), transparent 38%),
            linear-gradient(120deg, #EAF4F1, #F8F7F0);
          border-top: 1px solid rgba(22, 124, 114, .15);
          color: var(--muted);
        }

        .public-footer .public-logo {
          color: var(--deep-teal);
          font-size: 20px;
        }

        .public-footer .public-logo-tagline {
          font-size: 8px;
        }

        .public-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
        }

        .public-footer-links a {
          color: #60736F;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: color .2s ease;
        }

        .public-footer-links a:hover {
          color: var(--primary);
        }

        .public-footer-links a[aria-current="page"] {
          color: var(--primary);
          font-weight: 750;
        }

        .public-copyright {
          width: 100%;
          padding-top: 22px;
          border-top: 1px solid rgba(22, 124, 114, .15);
          font-size: 12px;
          text-align: center;
          color: #71827D;
        }

        .public-page a:focus-visible,
        .public-page button:focus-visible,
        .public-page summary:focus-visible {
          outline: 3px solid rgba(214, 168, 79, .65);
          outline-offset: 4px;
        }

        @media (max-width: 1150px) {
          .public-nav {
            padding: 0 4%;
            gap: 14px;
          }

          .public-nav-links {
            gap: 13px;
          }

          .public-nav-links a {
            font-size: 12px;
          }

          .public-nav-actions {
            gap: 12px;
          }
        }

        @media (max-width: 900px) {
          .public-nav {
            min-height: 72px;
            padding: 12px 5%;
            flex-wrap: wrap;
            gap: 0;
          }

          .public-logo {
            font-size: 21px;
          }

          .public-menu-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .public-nav-links,
          .public-nav-actions {
            display: none;
            width: 100%;
          }

          .public-nav.menu-open .public-nav-links {
            display: flex;
            order: 3;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: 12px 0;
            margin-top: 13px;
            border-top: 1px solid rgba(22, 124, 114, .15);
          }

          .public-nav.menu-open .public-nav-links a {
            padding: 13px 10px;
            font-size: 14px;
            border-radius: 8px;
          }

          .public-nav.menu-open .public-nav-links a:hover,
          .public-nav.menu-open .public-nav-links a.active {
            background: var(--mint);
          }

          .public-nav-links a::after {
            display: none;
          }

          .public-nav.menu-open .public-nav-actions {
            display: flex;
            order: 4;
            padding: 13px 0 5px;
            border-top: 1px solid rgba(22, 124, 114, .15);
          }

          .public-hero {
            padding: 68px 6% 58px;
          }

          .public-hero h1 {
            letter-spacing: -1.2px;
          }

          .public-content {
            padding: 48px 6% 68px;
          }

        }

        @media (max-width: 600px) {
          .public-hero {
            padding: 55px 6% 45px;
          }

          .public-hero h1 {
            font-size: clamp(32px, 9vw, 42px);
          }

          .public-hero p {
            font-size: 14px;
          }

          .public-content {
            padding: 36px 5% 55px;
          }

          .public-card {
            padding: 23px;
            border-radius: 16px;
          }

          .public-footer {
            justify-content: center;
            text-align: center;
            padding: 35px 6% 22px;
          }

          .public-footer .public-logo {
            justify-content: center;
          }

          .public-footer-links {
            justify-content: center;
            gap: 16px;
          }
        }

        @media (max-width: 380px) {
          .public-logo {
            font-size: 19px;
          }

          .public-logo-mark {
            width: 35px;
            height: 35px;
          }

          .public-logo-tagline {
            font-size: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .public-page *,
          .public-page *::before,
          .public-page *::after {
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
          }

          .public-card:hover,
          .public-logo:hover,
          .public-button:hover {
            transform: none;
          }
        }
      `}</style>

      <header className={`public-nav ${menuOpen ? "menu-open" : ""}`}>
        <Link to="/home" className="public-logo" onClick={closeMenu}>
          <span className="public-logo-mark">D</span>
          <span className="public-logo-copy">
            <span className="public-logo-name">DocuFortis</span>
            <span className="public-logo-tagline">by Code Syndicate</span>
          </span>
        </Link>

        <nav className="public-nav-links" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className={activePage === link.key ? "active" : ""}
              aria-current={activePage === link.key ? "page" : undefined}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="public-nav-actions">
          {!user ? (
            <>
              <Link to="/login" className="public-login" onClick={closeMenu}>
                Login
              </Link>
              <Link
                to="/register"
                className="public-button"
                onClick={closeMenu}
              >
                Get Started
              </Link>
            </>
          ) : (
            <PublicProfileMenu
              user={user}
              onLogout={onLogout}
              onSettings={onSettings}
              onCloseMenu={closeMenu}
            />
          )}
        </div>

        <button
          type="button"
          className="public-menu-toggle"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      <section className="public-hero">
        <span className="public-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <main className="public-content">{children}</main>

      <footer className="public-footer">
        <Link to="/home" className="public-logo">
          <span className="public-logo-mark">D</span>
          <span className="public-logo-copy">
            <span className="public-logo-name">DocuFortis</span>
            <span className="public-logo-tagline">by Code Syndicate</span>
          </span>
        </Link>

        <div className="public-footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/features">Features</Link>
          <Link to="/security">Security</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link
            to="/privacy"
            aria-current={activePage === "privacy" ? "page" : undefined}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            aria-current={activePage === "terms" ? "page" : undefined}
          >
            Terms of Service
          </Link>
        </div>

        <div className="public-copyright">
          © {new Date().getFullYear()} DocuFortis. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default PublicPageLayout;
