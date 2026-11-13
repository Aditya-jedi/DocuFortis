
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { PublicProfileMenu } from "./PublicPageLayout";

const features = [
  {
    icon: "🛡️",
    title: "Multi-Factor Authentication",
    description:
      "Add an extra layer of account protection with authenticator-based MFA and recovery codes.",
  },
  {
    icon: "🔗",
    title: "Controlled Document Sharing",
    description:
      "Share documents with specific recipients and choose whether they can view or download them.",
  },
  {
    icon: "⏱️",
    title: "Time-Limited Access",
    description:
      "Set expiration periods for shared links and revoke access whenever you need to.",
  },
  {
    icon: "📋",
    title: "Security Audit Trail",
    description:
      "Keep track of important account, document, and sharing activities through audit records.",
  },
  {
    icon: "🔐",
    title: "Protected Accounts",
    description:
      "Use secure authentication, password protection, and session controls to safeguard access.",
  },
  {
    icon: "📁",
    title: "Centralized Document Storage",
    description:
      "Upload, organize, preview, and manage your documents from one convenient dashboard.",
  },
];

function Landing({ user, onLogout, onSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          --primary: #167C72;
          --primary-dark: #115F57;
          --deep-teal: #174A45;
          --gold: #D6A84F;
          --gold-light: #F5E9C9;
          --text: #263B39;
          --muted: #687B77;
          --border: rgba(22, 124, 114, 0.14);
          --surface: rgba(255, 255, 255, 0.82);
          --background: #FAFAF6;
          --mint: #EAF4F1;

          color: var(--text);
          font-family: "DM Sans", "Manrope", Arial, sans-serif;
          background: var(--background);
          min-height: 100vh;
          overflow: hidden;
        }

        .landing-page *,
        .landing-page *::before,
        .landing-page *::after {
          box-sizing: border-box;
        }

        .landing-page a {
          -webkit-tap-highlight-color: transparent;
        }

        .landing-page a:focus-visible,
        .landing-page button:focus-visible {
          outline: 3px solid rgba(214, 168, 79, 0.7);
          outline-offset: 4px;
        }

        /* Navigation */

        .landing-nav {
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

        .landing-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--deep-teal);
          font-size: 22px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: -0.8px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .landing-logo-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1.1;
        }

        .landing-logo-tagline {
          color: #A47B2D;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.65px;
          line-height: 1.2;
        }

        .landing-logo:hover {
          transform: translateY(-1px);
        }

        .landing-logo-mark {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          background: linear-gradient(140deg, var(--primary), var(--deep-teal));
          color: #fff;
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

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 23px;
        }

        .landing-nav-links a {
          color: #586C67;
          font-size: 13px;
          font-weight: 650;
          text-decoration: none;
          transition: color 0.2s ease;
          white-space: nowrap;
          position: relative;
        }

        .landing-nav-links a::after {
          content: "";
          position: absolute;
          left: 0;
          right: 100%;
          bottom: -7px;
          height: 2px;
          border-radius: 5px;
          background: var(--gold);
          transition: right 0.22s ease;
        }

        .landing-nav-links a:hover {
          color: var(--primary);
        }

        .landing-nav-links a:hover::after {
          right: 0;
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 19px;
          flex-shrink: 0;
        }

        .landing-login {
          color: var(--deep-teal);
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .landing-login:hover {
          color: var(--primary);
        }

        /* Buttons */

        .landing-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 13px 22px;
          border-radius: 11px;
          background: linear-gradient(135deg, #208F83, #167C72);
          color: #fff;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
          border: 1px solid var(--primary);
          transition:
            background 0.22s ease,
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
          cursor: pointer;
          box-shadow: 0 5px 13px rgba(22, 124, 114, 0.13);
        }

        .landing-button:hover {
          background: linear-gradient(135deg, #176F65, #115F57);
          color: white;
          transform: translateY(-2px);
          border-color: var(--gold);
          box-shadow:
            0 9px 22px rgba(22, 124, 114, 0.19),
            0 0 0 2px rgba(214, 168, 79, 0.12);
        }

        .landing-button-outline {
          background: rgba(255, 255, 255, 0.72);
          color: var(--primary);
          border: 1px solid rgba(22, 124, 114, 0.3);
          box-shadow: none;
        }

        .landing-button-outline:hover {
          background: var(--mint);
          color: var(--deep-teal);
          border-color: var(--gold);
          box-shadow: 0 7px 18px rgba(23, 74, 69, 0.08);
        }

        .landing-menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.8);
          color: var(--deep-teal);
          font-size: 21px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .landing-menu-toggle:hover {
          background: var(--mint);
          border-color: var(--gold);
        }

        /* Hero */

        .landing-hero {
          position: relative;
          padding: 112px 7% 105px;
          text-align: center;
          background:
            radial-gradient(
              ellipse at 50% 0%,
              rgba(22, 124, 114, 0.15),
              transparent 63%
            ),
            radial-gradient(
              circle at 90% 80%,
              rgba(214, 168, 79, 0.1),
              transparent 29%
            ),
            linear-gradient(180deg, #fff 0%, #F1F7F4 100%);
        }

        .landing-hero::before,
        .landing-hero::after {
          content: "";
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(2px);
        }

        .landing-hero::before {
          top: 75px;
          left: -125px;
          background: rgba(22, 124, 114, 0.055);
          border: 1px solid rgba(22, 124, 114, 0.08);
        }

        .landing-hero::after {
          right: -110px;
          bottom: 10px;
          background: rgba(214, 168, 79, 0.09);
          border: 1px solid rgba(214, 168, 79, 0.13);
        }

        .landing-hero-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
        }

        .landing-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 16px;
          border: 1px solid rgba(214, 168, 79, 0.55);
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 30px;
          color: var(--deep-teal);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(23, 74, 69, 0.045);
        }

        .landing-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(214, 168, 79, 0.15);
        }

        .landing-hero h1 {
          max-width: 850px;
          margin: 27px auto 20px;
          font-size: clamp(40px, 6vw, 70px);
          line-height: 1.1;
          letter-spacing: -3px;
          font-weight: 850;
          color: var(--deep-teal);
        }

        .landing-highlight {
          background: linear-gradient(90deg, #167C72 8%, #208F83 55%, #B88A36 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .landing-hero p {
          max-width: 680px;
          margin: 0 auto;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.85;
        }

        .landing-hero-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 35px;
        }

        .landing-hero-actions .landing-button {
          min-height: 49px;
          padding-left: 25px;
          padding-right: 25px;
        }

        .landing-trust-note {
          margin-top: 28px;
          color: #758780;
          font-size: 12px;
          font-weight: 650;
        }

        /* General sections */

        .landing-section {
          padding: 92px 7%;
          scroll-margin-top: 90px;
          background:
            radial-gradient(
              circle at 95% 5%,
              rgba(22, 124, 114, 0.035),
              transparent 30%
            ),
            #F5F8F5;
        }

        .landing-section-white {
          background: #fff;
        }

        .landing-section-heading {
          max-width: 690px;
          margin: 0 auto 52px;
          text-align: center;
        }

        .landing-section-heading span {
          color: var(--primary);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .landing-section-heading h2 {
          margin: 14px 0;
          color: var(--deep-teal);
          font-size: clamp(29px, 4vw, 42px);
          line-height: 1.2;
          letter-spacing: -1.5px;
        }

        .landing-section-heading p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.85;
          margin: 0;
        }

        /* Feature cards */

        .landing-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          max-width: 1150px;
          margin: 0 auto;
        }

        .landing-feature-card {
          padding: 30px;
          border: 1px solid rgba(22, 124, 114, 0.13);
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 18px;
          box-shadow: 0 7px 24px rgba(23, 74, 69, 0.045);
          transition:
            transform 0.28s ease,
            box-shadow 0.28s ease,
            border-color 0.28s ease,
            background 0.28s ease;
        }

        .landing-feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(214, 168, 79, 0.7);
          background: rgba(255, 255, 255, 0.94);
          box-shadow:
            0 17px 38px rgba(23, 74, 69, 0.09),
            0 0 0 1px rgba(214, 168, 79, 0.08);
        }

        .landing-feature-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: linear-gradient(145deg, #EAF4F1, #F7F4E9);
          border: 1px solid rgba(214, 168, 79, 0.35);
          font-size: 24px;
          box-shadow: 0 5px 13px rgba(23, 74, 69, 0.045);
        }

        .landing-feature-card h3 {
          margin: 21px 0 10px;
          color: var(--deep-teal);
          font-size: 17px;
          letter-spacing: -0.3px;
        }

        .landing-feature-card p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.8;
        }

        /* Workflow */

        .landing-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 25px;
          max-width: 1050px;
          margin: 0 auto;
        }

        .landing-step {
          text-align: center;
          padding: 32px 23px;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(22, 124, 114, 0.13);
          border-radius: 18px;
          box-shadow: 0 7px 24px rgba(23, 74, 69, 0.04);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .landing-step:hover {
          transform: translateY(-5px);
          border-color: rgba(214, 168, 79, 0.65);
          box-shadow: 0 15px 32px rgba(23, 74, 69, 0.08);
        }

        .landing-step-number {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin: 0 auto 19px;
          border-radius: 16px;
          background: linear-gradient(145deg, #EAF4F1, #F7F0DE);
          border: 1px solid rgba(214, 168, 79, 0.55);
          color: var(--primary);
          font-size: 19px;
          font-weight: 850;
          box-shadow: 0 5px 13px rgba(23, 74, 69, 0.045);
        }

        .landing-step h3 {
          color: var(--deep-teal);
          font-size: 17px;
          margin: 0 0 11px;
        }

        .landing-step p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.8;
          margin: 0;
        }

        /* Security section */

        .landing-security {
          max-width: 1100px;
          margin: 0 auto;
          padding: 55px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          border: 1px solid rgba(214, 168, 79, 0.48);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 90% 10%,
              rgba(214, 168, 79, 0.15),
              transparent 35%
            ),
            linear-gradient(120deg, #EAF4F1, #FAFAF6);
          box-shadow: 0 13px 36px rgba(23, 74, 69, 0.06);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
        }

        .landing-security-content {
          max-width: 650px;
        }

        .landing-security h2 {
          margin: 20px 0 14px;
          color: var(--deep-teal);
          font-size: clamp(28px, 4vw, 38px);
          line-height: 1.2;
          letter-spacing: -1.2px;
        }

        .landing-security p {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.85;
          margin-bottom: 25px;
        }

        .landing-security-icon {
          width: 145px;
          height: 145px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(214, 168, 79, 0.65);
          border-radius: 35px;
          font-size: 75px;
          flex-shrink: 0;
          box-shadow:
            0 15px 35px rgba(23, 74, 69, 0.08),
            0 0 0 5px rgba(214, 168, 79, 0.06);
        }

        /* Pricing */

        .landing-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: stretch;
        }

        .landing-pricing-card {
          padding: 31px;
          border: 1px solid rgba(22, 124, 114, 0.15);
          border-radius: 19px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 25px rgba(23, 74, 69, 0.045);
          display: flex;
          flex-direction: column;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .landing-pricing-card:hover {
          transform: translateY(-5px);
          border-color: rgba(214, 168, 79, 0.65);
          box-shadow: 0 16px 34px rgba(23, 74, 69, 0.085);
        }

        .landing-pricing-card-premium {
          position: relative;
          border: 2px solid var(--gold);
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(214, 168, 79, 0.17),
              transparent 40%
            ),
            linear-gradient(180deg, #F9F5E9, #fff 72%);
          box-shadow:
            0 12px 32px rgba(160, 119, 42, 0.1),
            inset 0 0 25px rgba(214, 168, 79, 0.045);
        }

        .landing-pricing-card-premium:hover {
          border-color: #B88A36;
          box-shadow:
            0 18px 38px rgba(160, 119, 42, 0.15),
            0 0 0 3px rgba(214, 168, 79, 0.09);
        }

        .landing-plan-label {
          display: inline-block;
          align-self: flex-start;
          padding: 7px 12px;
          border-radius: 20px;
          background: #EAF4F1;
          color: var(--primary);
          border: 1px solid rgba(22, 124, 114, 0.12);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .landing-pricing-card-premium .landing-plan-label {
          background: #F3E5C3;
          color: #795719;
          border-color: rgba(184, 138, 54, 0.4);
        }

        .landing-pricing-card h3 {
          margin: 19px 0 9px;
          color: var(--deep-teal);
          font-size: 18px;
        }

        .landing-plan-storage {
          margin: 0 0 14px;
          color: var(--primary);
          font-size: 34px;
          font-weight: 850;
          letter-spacing: -1.5px;
        }

        .landing-pricing-card-premium .landing-plan-storage {
          color: #A57925;
        }

        .landing-pricing-card p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.8;
          margin: 0 0 25px;
          flex: 1;
        }

        .landing-pricing-card .landing-button {
          align-self: flex-start;
        }

        /* Call to action */

        .landing-cta {
          position: relative;
          overflow: hidden;
          padding: 88px 7%;
          text-align: center;
          color: var(--deep-teal);
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(214, 168, 79, 0.19),
              transparent 55%
            ),
            radial-gradient(
              circle at 10% 100%,
              rgba(22, 124, 114, 0.1),
              transparent 40%
            ),
            linear-gradient(135deg, #EAF4F1, #FAFAF6);
          border-top: 1px solid rgba(22, 124, 114, 0.1);
          border-bottom: 1px solid rgba(22, 124, 114, 0.1);
        }

        .landing-cta::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          border: 1px solid rgba(214, 168, 79, 0.35);
          top: -170px;
          right: 10%;
          pointer-events: none;
        }

        .landing-cta h2 {
          position: relative;
          margin: 0 0 16px;
          font-size: clamp(29px, 4vw, 43px);
          letter-spacing: -1.5px;
          color: var(--deep-teal);
        }

        .landing-cta p {
          position: relative;
          max-width: 590px;
          margin: 0 auto 30px;
          color: var(--muted);
          line-height: 1.85;
          font-size: 15px;
        }

        .landing-cta .landing-button {
          position: relative;
          border-color: var(--gold);
          box-shadow:
            0 7px 18px rgba(22, 124, 114, 0.14),
            0 0 0 3px rgba(214, 168, 79, 0.08);
        }

        /* Footer */

        .landing-footer {
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

        .landing-footer .landing-logo {
          color: var(--deep-teal);
          font-size: 20px;
          max-width: 100%;
        }

        .landing-footer .landing-logo-mark {
          width: 39px;
          height: 39px;
        }

        .landing-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
          max-width: 100%;
        }

        .landing-footer-links a {
          color: #60736F;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .landing-footer-links a:hover {
          color: var(--primary);
        }

        .landing-copyright {
          width: 100%;
          padding-top: 22px;
          border-top: 1px solid rgba(22, 124, 114, .15);
          font-size: 12px;
          text-align: center;
          color: #71827D;
          overflow-wrap: anywhere;
        }

        /* Tablet */

        @media (max-width: 1100px) {
          .landing-nav {
            padding: 0 4%;
            gap: 15px;
          }

          .landing-nav-links {
            gap: 13px;
          }

          .landing-nav-links a {
            font-size: 11px;
          }

          .landing-nav-actions {
            gap: 12px;
          }
        }

        @media (max-width: 850px) {
          .landing-nav {
            padding: 0 5%;
          }

          .landing-nav-links {
            gap: 11px;
          }

          .landing-feature-grid,
          .landing-pricing-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .landing-section {
            padding: 75px 5%;
          }

          .landing-pricing-card:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 900px) {
          .landing-nav {
            min-height: 72px;
            padding: 12px 5%;
            flex-wrap: wrap;
            gap: 0;
          }

          .landing-logo {
            font-size: 21px;
          }

          .landing-menu-toggle {
            display: flex;
          }

          .landing-nav-links,
          .landing-nav-actions {
            display: none;
            width: 100%;
          }

          .landing-nav.menu-open .landing-nav-links {
            display: flex;
            order: 3;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: 12px 0;
            border-top: 1px solid var(--border);
            margin-top: 12px;
          }

          .landing-nav.menu-open .landing-nav-links a {
            padding: 13px 5px;
            font-size: 14px;
          }

          .landing-nav.menu-open .landing-nav-links a::after {
            display: none;
          }

          .landing-nav.menu-open .landing-nav-actions {
            display: flex;
            order: 4;
            padding: 14px 0 5px;
            border-top: 1px solid var(--border);
          }

          .landing-nav-actions .landing-button {
            padding: 10px 15px;
          }
        }

        /* Mobile */

        @media (max-width: 700px) {
          .landing-hero {
            padding: 78px 6% 75px;
          }

          .landing-hero h1 {
            font-size: clamp(38px, 10vw, 52px);
            letter-spacing: -1.8px;
          }

          .landing-hero p {
            font-size: 15px;
          }

          .landing-trust-note {
            line-height: 1.8;
          }

          .landing-feature-grid,
          .landing-steps,
          .landing-pricing-grid {
            grid-template-columns: 1fr;
          }

          .landing-pricing-card:last-child {
            grid-column: auto;
          }

          .landing-section {
            padding: 68px 6%;
          }

          .landing-section-heading {
            margin-bottom: 35px;
          }

          .landing-security {
            padding: 32px 23px;
            flex-direction: column;
            text-align: center;
          }

          .landing-security-icon {
            width: 110px;
            height: 110px;
            border-radius: 27px;
            font-size: 58px;
          }

          .landing-security .landing-eyebrow {
            margin: 0 auto;
          }

          .landing-footer {
            justify-content: center;
            text-align: center;
            padding: 35px 6% 22px;
          }

          .landing-footer .landing-logo {
            justify-content: center;
          }

          .landing-footer-links {
            justify-content: center;
            gap: 16px;
          }

          .landing-cta {
            padding: 70px 6%;
          }
        }

        @media (max-width: 380px) {
          .landing-logo {
            font-size: 19px;
          }

          .landing-logo-mark {
            width: 35px;
            height: 35px;
          }

          .landing-nav-actions {
            gap: 12px;
          }

          .landing-nav-actions .landing-button {
            padding: 9px 12px;
            font-size: 12px;
          }

          .landing-hero h1 {
            font-size: 36px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-page *,
          .landing-page *::before,
          .landing-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <header className={`landing-nav ${menuOpen ? "menu-open" : ""}`}>
        <Link to="/home" className="landing-logo" onClick={closeMenu}>
          <span className="landing-logo-mark">D</span>
          <span className="landing-logo-copy">
            <span>DocuFortis</span>
            <span className="landing-logo-tagline">by Code Syndicate</span>
          </span>
        </Link>

        <nav
          id="landing-navigation"
          className="landing-nav-links"
          aria-label="Main navigation"
        >
          <Link to="/home" onClick={closeMenu}>Home</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
          <Link to="/features" onClick={closeMenu}>Features</Link>
          <Link to="/how-it-works" onClick={closeMenu}>How It Works</Link>
          <Link to="/security" onClick={closeMenu}>Security</Link>
          <Link to="/plans" onClick={closeMenu}>Plans</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/faq" onClick={closeMenu}>FAQ</Link>
        </nav>

        <div className="landing-nav-actions">
          {user ? (
            <PublicProfileMenu
              user={user}
              onLogout={onLogout}
              onSettings={onSettings}
              onCloseMenu={closeMenu}
            />
          ) : (
            <>
              <Link to="/login" className="landing-login" onClick={closeMenu}>
                Login
              </Link>

              <Link to="/register" className="landing-button" onClick={closeMenu}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="landing-menu-toggle"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-navigation"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-content">
            <span className="landing-eyebrow">
              <span className="landing-eyebrow-dot" />
              Secure Document Management
            </span>

            <h1>
              Your Documents.
              <br />
              Your Control.
              <br />
              <span className="landing-highlight">Your Security.</span>
            </h1>

            <p>
              Store, manage, and share important documents with greater control.
              DocuFortis brings document management and security-focused sharing
              together in one platform.
            </p>

            <div className="landing-hero-actions">
              <Link to="/register" className="landing-button">
                Create Your Account →
              </Link>

              <Link to="/features" className="landing-button landing-button-outline">
                Explore Features
              </Link>
            </div>

            <div className="landing-trust-note">
              Secure access · Controlled sharing · Centralized document management
            </div>
          </div>
        </section>

        <section
          id="features"
          className="landing-section landing-section-white"
        >
          <div className="landing-section-heading">
            <span>Platform Features</span>
            <h2>Everything you need to manage documents</h2>
            <p>
              A practical document platform with security-focused tools
              designed to help you stay in control of your files and access.
            </p>
          </div>

          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.title}>
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-section">
          <div className="landing-section-heading">
            <span>Simple Workflow</span>
            <h2>Get started in three steps</h2>
            <p>
              Manage your documents without an unnecessarily complicated
              workflow.
            </p>
          </div>

          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-number">1</div>
              <h3>Create Your Account</h3>
              <p>
                Register and access your personal DocuFortis workspace.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-number">2</div>
              <h3>Upload Your Documents</h3>
              <p>
                Store and manage your supported documents from your dashboard.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-number">3</div>
              <h3>Share With Control</h3>
              <p>
                Create sharing links with permissions, recipient restrictions,
                and expiration periods.
              </p>
            </div>
          </div>
        </section>

        <section
          id="security"
          className="landing-section landing-section-white"
        >
          <div className="landing-security">
            <div className="landing-security-content">
              <span className="landing-eyebrow">Security Matters</span>

              <h2>
                More control over who accesses your documents.
              </h2>

              <p>
                DocuFortis combines multi-factor authentication, controlled
                sharing permissions, expiring links, and activity records to
                support a more security-conscious document workflow.
              </p>

              <Link to="/security" className="landing-button">
                Explore Security →
              </Link>
            </div>

            <div className="landing-security-icon" aria-hidden="true">
              🛡️
            </div>
          </div>
        </section>

        <section id="pricing" className="landing-section">
          <div className="landing-section-heading">
            <span>Flexible Plans</span>
            <h2>Choose the storage that fits your needs</h2>
            <p>
              Start with the free plan and explore additional storage through
              the Premium plan.
            </p>
          </div>

          <div className="landing-pricing-grid">
            <div className="landing-pricing-card">
              <span className="landing-plan-label">Get started</span>
              <h3>Free Plan</h3>
              <div className="landing-plan-storage">60 MB</div>
              <p>
                Personal document storage with the core DocuFortis
                functionality.
              </p>
              <Link
                to="/register"
                className="landing-button landing-button-outline"
              >
                Get Started
              </Link>
            </div>

            <div className="landing-pricing-card landing-pricing-card-premium">
              <span className="landing-plan-label">More storage</span>
              <h3>Premium Plan</h3>
              <div className="landing-plan-storage">90 MB</div>
              <p>
                30 MB of additional storage with the same security-focused
                document management experience.
              </p>
              <Link to="/plans" className="landing-button">
                Explore Premium →
              </Link>
            </div>

            <div className="landing-pricing-card">
              <span className="landing-plan-label">All in one place</span>
              <h3>Built for Control</h3>
              <div className="landing-plan-storage">One Platform</div>
              <p>
                Manage documents, sharing permissions, account security, and
                activity in one place.
              </p>
              <Link
                to="/features"
                className="landing-button landing-button-outline"
              >
                View Features
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <h2>Take control of your documents.</h2>
          <p>
            Get started with DocuFortis and experience a more organized,
            security-conscious way to manage and share documents.
          </p>

          <Link to="/register" className="landing-button">
            Create Your Free Account →
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/home" className="landing-logo">
          <span className="landing-logo-mark">D</span>
          <span className="landing-logo-copy">
            <span>DocuFortis</span>
            <span className="landing-logo-tagline">by Code Syndicate</span>
          </span>
        </Link>

        <div className="landing-footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>

        <div className="landing-copyright">
          © {new Date().getFullYear()} DocuFortis. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Landing;
