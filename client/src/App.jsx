
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";
import "./App.css";
import {
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

import SharedDocument from "./pages/SharedDocument";
import { formatDate } from "./utils/formatDate";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./components/AdminDashboard";
import PremiumPlans from "./pages/PremiumPlans";
import PremiumCheckout from "./pages/PremiumCheckout";
import { GoogleLogin } from "@react-oauth/google";

import Landing from "./pages/Landing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Security from "./pages/Security";
import Plans from "./pages/Plans";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SHARE_RETURN_TO_KEY = "docufortis.shareReturnTo";

function getSafeShareReturnTo(path) {
  return typeof path === "string" &&
    /^\/shared\/[a-f0-9]{64}$/.test(path)
    ? path
    : null;
}

function readStoredShareReturnTo() {
  try {
    return getSafeShareReturnTo(
      window.sessionStorage.getItem(SHARE_RETURN_TO_KEY)
    );
  } catch {
    return null;
  }
}

function clearStoredShareReturnTo() {
  try {
    window.sessionStorage.removeItem(SHARE_RETURN_TO_KEY);
  } catch {
    // The current URL remains available as a fallback.
  }
}

const countryNames = new Intl.DisplayNames(["en"], {
  type: "region",
});

const PHONE_COUNTRIES = getCountries()
  .map((country) => ({
    code: `+${getCountryCallingCode(country)}`,
    name: countryNames.of(country),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const isLogin = location.pathname !== "/register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);

  // Account settings
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Premium upgrade state
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // MFA login verification
  const [mfaChallengeToken, setMfaChallengeToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  // MFA management
  const [mfaEnrollment, setMfaEnrollment] = useState(null);
  const [mfaEnrollmentCode, setMfaEnrollmentCode] = useState("");
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState([]);
  const [mfaPassword, setMfaPassword] = useState("");
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaActionLoading, setMfaActionLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Storage usage
  const [storageUsage, setStorageUsage] = useState(null);
  const [storageLoading, setStorageLoading] = useState(false);

  const [shares, setShares] = useState([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  const [sharingDocument, setSharingDocument] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("VIEW");
  const [shareExpiry, setShareExpiry] = useState(24);
  const [sharing, setSharing] = useState(false);
  const [createdShare, setCreatedShare] = useState(null);
  const shareDialogRef = useRef(null);
  const sharingInProgressRef = useRef(false);
  const previousPathRef = useRef(location.pathname);
  sharingInProgressRef.current = sharing;

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const isForgotPasswordRoute =
    window.location.pathname === "/forgot-password";

  const isResetPasswordRoute =
    window.location.pathname === "/reset-password";

  function getReturnDestination() {
    return (
      getSafeShareReturnTo(location.state?.returnTo) ||
      getSafeShareReturnTo(location.pathname) ||
      readStoredShareReturnTo()
    );
  }

  function finishAuthentication() {
    const destination = getReturnDestination();
    clearStoredShareReturnTo();
    navigate(destination || "/", { replace: true });
  }

  useEffect(() => {
    const sharePath =
      getSafeShareReturnTo(location.state?.returnTo) ||
      getSafeShareReturnTo(location.pathname);

    if (sharePath && !user) {
      try {
        window.sessionStorage.setItem(SHARE_RETURN_TO_KEY, sharePath);
      } catch {
        // The current URL remains available as a fallback.
      }
    } else {
      clearStoredShareReturnTo();
    }
  }, [location.pathname, location.state, user]);

  useEffect(() => {
    if (!sharingDocument) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => {
      shareDialogRef.current
        ?.querySelector("button:not([disabled])")
        ?.focus();
    });

    document.body.style.overflow = "hidden";

    function handleDialogKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (sharingInProgressRef.current) return;
        setSharingDocument(null);
        setCreatedShare(null);
        setShareEmail("");
        setMessage("");
        return;
      }

      if (event.key !== "Tab" || !shareDialogRef.current) return;

      const focusableElements = shareDialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (
        !shareDialogRef.current.contains(document.activeElement) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        firstElement.focus();
      } else if (
        !shareDialogRef.current.contains(document.activeElement) &&
        event.shiftKey
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [sharingDocument]);

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return;

    previousPathRef.current = location.pathname;
    setSharingDocument(null);
    setCreatedShare(null);
    setShareEmail("");
    setSharePermission("VIEW");
    setShareExpiry(24);
    setMessage(location.state?.registrationSuccessMessage || "");
  }, [location.pathname, location.state]);

  // Public pages that can be visited without logging in.
  const publicPagePaths = [
    "/",
    "/home",
    "/about",
    "/features",
    "/how-it-works",
    "/security",
    "/plans",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
  ];

  const isPublicPage = publicPagePaths.includes(location.pathname);

  // Navigate to the account settings page from public navigation.
  const openSettings = useCallback(() => {
    navigate("/dashboard/settings");
  }, [navigate]);

  // Load storage usage.
  const loadStorageUsage = useCallback(async () => {
    setStorageLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/documents/usage`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load storage usage."
        );
      }

      setStorageUsage(data.storage);
    } catch (error) {
      console.error("Storage usage error:", error);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  // Load documents and refresh storage usage.
  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/documents`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load documents."
        );
      }

      setDocuments(data.documents || []);

      await loadStorageUsage();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  }, [loadStorageUsage]);

  // Load sharing links.
  const loadShares = useCallback(async () => {
    try {
      setSharesLoading(true);

      const response = await fetch(`${API_URL}/api/shares`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setShares(data.shares || []);
      } else {
        setMessage(
          data.message || "Unable to load sharing links."
        );
      }
    } catch (error) {
      console.error("Load shares error:", error);
      setMessage("Unable to load sharing links.");
    } finally {
      setSharesLoading(false);
    }
  }, []);

  // Update the user's profile.
  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setMessage("");

    if (profileName.trim().length < 2) {
      setMessage("Name must contain at least 2 characters.");
      return;
    }

    if (phoneNumber.trim() && !phoneCountryCode.trim()) {
      setMessage("Enter a country code for your phone number.");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/profile`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: profileName.trim(),
            phoneCountryCode: phoneNumber.trim()
              ? phoneCountryCode.trim()
              : null,
            phoneNumber: phoneNumber.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update your profile."
        );
      }

      const updatedUser = data.user || data;

      setUser((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      setProfileName(updatedUser.name || profileName.trim());
      setProfileEmail(updatedUser.email || profileEmail);
      setPhoneCountryCode(updatedUser.phoneCountryCode || "");
      setPhoneNumber(updatedUser.phoneNumber || "");

      setMessage(data.message || "Profile updated successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Change the account password.
  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setMessage("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("Your new password must be different from your current password.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to change your password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setMessage(data.message || "Password changed successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  // Submit Premium upgrade request.
  const submitUpgradeRequest = async (pricingOption) => {
    setUpgradeLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/upgrades/request`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pricingOption }),
        }
      );

      const data = await response.json(      );

      if (response.status === 409 && data.request) {
        setMessage(data.message || "Payment is awaiting admin approval.");
        navigate("/");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create Premium payment order."
        );
      }

      navigate("/premium/checkout");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Check whether the user already has an active session.
  useEffect(() => {
    if (isResetPasswordRoute || isForgotPasswordRoute) {
      return;
    }

    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        const currentUser = data.user || data;

        setUser(currentUser);

        if (currentUser.role !== "ADMIN") {
          await loadDocuments();
          await loadShares();
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }

    checkSession();
  }, [
    isResetPasswordRoute,
    isForgotPasswordRoute,
    loadDocuments,
    loadShares,
  ]);

  // Keep admins on the dashboard unless they visit a public page.
  useEffect(() => {
    if (
      user?.role === "ADMIN" &&
      !isPublicPage &&
      location.pathname !== "/" &&
      !location.pathname.startsWith("/shared/")
    ) {
      navigate("/", { replace: true });
    }
  }, [
    user,
    location.pathname,
    isPublicPage,
    navigate,
  ]);

  // Load profile when the Settings page is opened.
  const profileUserId =
    user?.role !== "ADMIN" ? user?.id : null;

  useEffect(() => {
    if (!profileUserId || location.pathname !== "/dashboard/settings") {
      return undefined;
    }

    let active = true;

    async function fetchProfile() {
      setProfileLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/auth/profile`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load account details."
          );
        }

        if (!active) return;

        const profile = data.user || data;

        setProfileName(profile.name || "");
        setProfileEmail(profile.email || "");
        setPhoneCountryCode(profile.phoneCountryCode || "");
        setPhoneNumber(profile.phoneNumber || "");
        setUser((previous) => ({
          ...previous,
          ...profile,
        }));
      } catch (error) {
        if (active) setMessage(error.message);
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    void fetchProfile();

    return () => {
      active = false;
    };
  }, [profileUserId, location.pathname]);

  // Handle shared document links after checking authentication.
  const sharedDocumentMatch = window.location.pathname.match(
    /^\/shared\/([a-f0-9]{64})$/
  );

  const isSharedDocumentRoute =
    window.location.pathname.startsWith("/shared/");

  if (isResetPasswordRoute) {
    return <ResetPassword />;
  }

  if (isForgotPasswordRoute) {
    return <ForgotPassword />;
  }

  // Props shared with public-page navigation components.
  const publicPageProps = {
    user,
    onLogout: handleLogout,
    onSettings: openSettings,
  };

  // Public pages.
  if (location.pathname === "/home") {
    return <Landing {...publicPageProps} />;
  }

  if (location.pathname === "/about") {
    return <About {...publicPageProps} />;
  }

  if (location.pathname === "/features") {
    return <Features {...publicPageProps} />;
  }

  if (location.pathname === "/how-it-works") {
    return <HowItWorks {...publicPageProps} />;
  }

  if (location.pathname === "/security") {
    return <Security {...publicPageProps} />;
  }

  if (location.pathname === "/plans") {
    return <Plans {...publicPageProps} />;
  }

  if (location.pathname === "/contact") {
    return <Contact {...publicPageProps} />;
  }

  if (location.pathname === "/faq") {
    return <FAQ {...publicPageProps} />;
  }

  if (location.pathname === "/privacy") {
    return <Privacy {...publicPageProps} />;
  }

  if (location.pathname === "/terms") {
    return <Terms {...publicPageProps} />;
  }

  if (!authChecked) {
    return (
      <main className="auth-container auth-screen">
        <p className="auth-session-loading" role="status">
          Loading DocuFortis...
        </p>
      </main>
    );
  }

  // Show the public landing page to logged-out visitors.
  if (!user && location.pathname === "/") {
    return <Landing {...publicPageProps} />;
  }

  if (isSharedDocumentRoute && user) {
    return (
      <SharedDocument
        token={sharedDocumentMatch?.[1] || null}
      />
    );
  }

  // Login and registration.
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!captchaToken) {
      setMessage("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const payload = {
        email,
        password,
        turnstileToken: captchaToken,
      };

      if (!isLogin) {
        payload.name = name;
      }

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (isLogin && data.requiresMfa) {
        if (!data.challengeToken) {
          throw new Error(
            "MFA challenge could not be created. Please log in again."
          );
        }

        setMfaChallengeToken(data.challengeToken);
        setMfaCode("");
        setPassword("");
        setCaptchaToken("");
        setWidgetKey((previous) => previous + 1);

        return;
      }

      setPassword("");
      setCaptchaToken("");
      setWidgetKey((previous) => previous + 1);

      if (isLogin) {
        setUser(data.user);
        setMessage("");

        await loadDocuments();
        await loadShares();

        finishAuthentication();
      } else {
        navigate("/login", {
          replace: true,
          state: {
            registrationSuccessMessage:
              data.message || "Account created successfully.",
          },
        });
      }
    } catch (error) {
      setMessage(error.message);
      setCaptchaToken("");
      setWidgetKey((previous) => previous + 1);
    } finally {
      setLoading(false);
    }
  }

  // Handle Google sign-in and registration.
  async function handleGoogleSuccess(credentialResponse) {
    if (!credentialResponse?.credential) {
      setMessage("Google authentication did not return a valid credential.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google sign-in failed.");
      }

      if (data.requiresMfa) {
        if (!data.challengeToken) {
          throw new Error(
            "MFA challenge could not be created. Please try again."
          );
        }

        setMfaChallengeToken(data.challengeToken);
        setMfaCode("");
        setPassword("");
        setMessage("");
        return;
      }

      if (!data.user) {
        throw new Error("Google authentication returned no user information.");
      }

      setUser(data.user);
      setMessage("");

      await loadDocuments();
      await loadShares();

      finishAuthentication();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Verify MFA during login.
  async function handleMfaVerify(event) {
    event.preventDefault();

    if (!mfaChallengeToken || !mfaCode.trim()) {
      setMessage("Enter your authenticator or recovery code.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/mfa/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            challengeToken: mfaChallengeToken,
            code: mfaCode.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "MFA verification failed."
        );
      }

      setUser(data.user);
      setMfaChallengeToken("");
      setMfaCode("");
      setMessage("");

      await loadDocuments();
      await loadShares();

      finishAuthentication();
    } catch (error) {
      setMessage(error.message);
      setMfaCode("");
    } finally {
      setLoading(false);
    }
  }

  // Start MFA enrollment.
  const handleMfaEnroll = async () => {
    setMfaActionLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/mfa/enroll`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not start MFA enrollment."
        );
      }

      setMfaEnrollment({
        qrCode: data.qrCode,
        expiresAt: data.expiresAt,
      });

      setMfaEnrollmentCode("");
      setMessage(
        data.message || "Scan the QR code with your authenticator app."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setMfaActionLoading(false);
    }
  };

  // Confirm and enable MFA.
  const handleMfaEnable = async () => {
    if (!mfaEnrollmentCode.trim()) {
      setMessage("Enter the 6-digit authenticator code.");
      return;
    }

    setMfaActionLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/mfa/enable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            code: mfaEnrollmentCode.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not enable MFA."
        );
      }

      setMfaRecoveryCodes(data.recoveryCodes || []);
      setMfaEnrollment(null);
      setMfaEnrollmentCode("");
      setMessage(data.message || "MFA enabled successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setMfaActionLoading(false);
    }
  };

  // Disable MFA.
  const handleMfaDisable = async () => {
    if (!mfaPassword.trim() || !mfaVerificationCode.trim()) {
      setMessage(
        "Enter your password and authenticator or recovery code."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to disable MFA? Your current session will end."
    );

    if (!confirmed) return;

    setMfaActionLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/mfa/disable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            password: mfaPassword,
            code: mfaVerificationCode.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not disable MFA."
        );
      }

      setUser(null);
      setDocuments([]);
      setShares([]);
      setStorageUsage(null);
      setMfaPassword("");
      setMfaVerificationCode("");
      setMfaEnrollment(null);
      setMfaRecoveryCodes([]);
      setMfaChallengeToken("");
      setMfaCode("");
      setCaptchaToken("");
      setWidgetKey((previous) => previous + 1);
      setMessage(
        data.message || "MFA disabled. Please log in again."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setMfaActionLoading(false);
    }
  };

  // Upload document.
  async function handleUpload(event) {
    event.preventDefault();
    setMessage("");

    if (!selectedFile) {
      setMessage("Please select a document first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Document upload failed."
        );
      }

      setMessage("Document uploaded successfully.");
      setSelectedFile(null);
      event.target.reset();

      await loadDocuments();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  // Download document.
  async function handleDownload(document) {
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${document.id}/download`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Download failed.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      setMessage(error.message);
    }
  }

  // Preview PDF or image.
  async function handlePreview(document) {
    setMessage("");

    const isPdf = document.mimeType === "application/pdf";

    const isImage = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(document.mimeType);

    if (!isPdf && !isImage) {
      setMessage("Preview is not supported for this file type.");
      return;
    }

    const previewWindow = window.open("about:blank", "_blank");

    if (!previewWindow) {
      setMessage("Please allow pop-ups to preview documents.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${document.id}/preview`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Unable to preview document."
        );
      }

      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);

      const previewDoc = previewWindow.document;

      previewDoc.title = document.originalName;
      previewDoc.body.style.margin = "0";
      previewDoc.body.style.background = "#FAFAF6";

      if (isImage) {
        const image = previewDoc.createElement("img");

        image.src = previewUrl;
        image.alt = document.originalName;
        image.style.width = "100%";
        image.style.height = "100vh";
        image.style.objectFit = "contain";

        previewDoc.body.appendChild(image);
      } else {
        const iframe = previewDoc.createElement("iframe");

        iframe.src = previewUrl;
        iframe.type = "application/pdf";
        iframe.style.width = "100%";
        iframe.style.height = "100vh";
        iframe.style.border = "none";

        previewDoc.body.appendChild(iframe);
      }

      previewWindow.addEventListener(
        "pagehide",
        () => URL.revokeObjectURL(previewUrl),
        { once: true }
      );
    } catch (error) {
      previewWindow.close();
      setMessage(error.message);
    }
  }

  // Delete document.
  async function handleDelete(document) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.originalName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setDeletingDocumentId(document.id);

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${document.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Document deletion failed."
        );
      }

      setMessage(data.message || "Document deleted successfully.");

      await loadDocuments();
      await loadShares();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingDocumentId(null);
    }
  }

  // Create sharing link.
  async function handleCreateShare(event) {
    event.preventDefault();
    setMessage("");
    setCreatedShare(null);
    setSharing(true);

    try {
      const response = await fetch(
        `${API_URL}/api/shares/${sharingDocument.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            recipientEmail: shareEmail,
            permission: sharePermission,
            expiresInHours: Number(shareExpiry),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create sharing link."
        );
      }

      const shareUrl =
        `${window.location.origin}/shared/${data.share.token}`;

      setCreatedShare({
        ...data.share,
        url: shareUrl,
      });

      setMessage("Sharing link created successfully.");

      await loadShares();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSharing(false);
    }
  }

  // Revoke sharing link.
  async function handleRevokeShare(share) {
    const documentName =
      share.document?.originalName || "this document";

    const confirmed = window.confirm(
      `Are you sure you want to revoke the sharing link for "${documentName}"? The recipient will no longer be able to access it.`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/shares/${share.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to revoke sharing link."
        );
      }

      setMessage("Sharing link revoked successfully.");
      await loadShares();
    } catch (error) {
      setMessage(error.message);
    }
  }

  // Logout.
  async function handleLogout() {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to log out. Please try again."
        );
      }

      setUser(null);
      setDocuments([]);
      setShares([]);
      setStorageUsage(null);
      clearStoredShareReturnTo();
      setProfileName("");
      setProfileEmail("");
      setPhoneCountryCode("");
      setPhoneNumber("");
      setMessage("You have logged out successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function switchAuthMode(loginMode) {
    setMessage("");
    setPassword("");
    setCaptchaToken("");
    setWidgetKey((previous) => previous + 1);

    const destination = getReturnDestination();
    navigate(loginMode ? "/login" : "/register", {
      state: destination ? { returnTo: destination } : null,
    });
  }

  // Authenticated dashboard.
  if (user) {
    if (user.role === "ADMIN") {
      return (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      );
    }

    // Premium plans and checkout remain dedicated pages.
    if (location.pathname === "/premium") {
      return (
        <PremiumPlans
          onProceed={submitUpgradeRequest}
          loading={upgradeLoading}
          onBack={() => navigate("/")}
        />
      );
    }

    if (location.pathname === "/premium/checkout") {
      return <PremiumCheckout />;
    }

    const currentPlan = user.plan || storageUsage?.plan || "FREE";
    const isPremium = currentPlan === "PREMIUM";

    // Keep the storage percentage within the valid progress range.
    const storagePercentage = Math.min(
      100,
      Math.max(0, Number(storageUsage?.usagePercentage) || 0)
    );

    const dashboardPage =
      location.pathname === "/dashboard/documents"
        ? "documents"
        : location.pathname === "/dashboard/sharing"
          ? "sharing"
          : location.pathname === "/dashboard/security"
            ? "security"
            : location.pathname === "/dashboard/settings"
              ? "settings"
              : "overview";

    // Determine the current state of a sharing link.
    const getShareState = (share) => {
      if (share.revokedAt) return "REVOKED";

      if (
        share.expiresAt &&
        new Date(share.expiresAt) <= new Date()
      ) {
        return "EXPIRED";
      }

      if (
        !share.document ||
        share.document.status === "DELETED"
      ) {
        return "UNAVAILABLE";
      }

      return "ACTIVE";
    };

    const formatSharePermission = (permission) => {
      if (permission === "VIEW") return "View only";
      if (permission === "VIEW_AND_DOWNLOAD") {
        return "View and download";
      }

      return permission;
    };

    const activeShares = shares.filter(
      (share) => getShareState(share) === "ACTIVE"
    );

    const historicalShares = shares.filter(
      (share) => getShareState(share) !== "ACTIVE"
    );

    const pageHeading = {
      overview: [
        "Overview",
        "Your secure document workspace at a glance.",
      ],
      documents: [
        "My Documents",
        "Manage, preview, share and download your files.",
      ],
      sharing: [
        "Shared Links",
        "Manage active links and review your sharing history.",
      ],
      security: [
        "Security",
        "Manage the security settings protecting your account.",
      ],
      settings: [
        "Account Settings",
        "Manage your profile and account preferences.",
      ],
    }[dashboardPage];

    const navLink = (path, label, symbol, page) => (
      <a
        href={path}
        className={`dashboard-nav-link ${
          dashboardPage === page ? "active" : ""
        }`}
        aria-current={
          dashboardPage === page ? "page" : undefined
        }
        onClick={(event) => {
          event.preventDefault();
          setMessage("");
          navigate(path);
        }}
      >
        <span>{symbol}</span>
        {label}
      </a>
    );

    // Reusable circular refresh button.
    const renderRefreshButton = (onClick, isRefreshing, label) => (
      <button
        type="button"
        onClick={onClick}
        disabled={isRefreshing}
        aria-label={label}
        title={isRefreshing ? "Refreshing..." : label}
        style={{
          width: "36px",
          height: "36px",
          minWidth: "36px",
          padding: 0,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "23px",
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            transform: isRefreshing ? "rotate(180deg)" : "none",
            transition: "transform 0.3s ease",
          }}
        >
          ↻
        </span>
      </button>
    );

    const supportsDocumentPreview = (document) =>
      [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(document.mimeType);

    // Reusable document list.
    const renderDocumentsList = () => (
      <section id="documents" className="documents-section">
        <div className="documents-heading">
          <h3>Your Documents ({documents.length})</h3>

          {renderRefreshButton(
            loadDocuments,
            documentsLoading,
            "Refresh documents"
          )}
        </div>

        {documentsLoading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <p>You haven't uploaded any documents yet.</p>
            {dashboardPage !== "overview" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/")}
              >
                Go to Overview to upload
              </button>
            )}
          </div>
        ) : (
          <div className="documents-list">
            {documents.map((document) => (
              <article className="document-item" key={document.id}>
                <div className="document-details">
                  <h4>{document.originalName}</h4>

                  <p>
                    {document.mimeType} ·{" "}
                    {(document.sizeBytes / 1024).toFixed(1)} KB
                  </p>

                  <small>{formatDate(document.createdAt)}</small>
                  {!supportsDocumentPreview(document) && (
                    <small className="preview-unavailable-note">
                      Preview unavailable for this file type.
                    </small>
                  )}
                </div>

                <div className="document-actions">
                  <button
                    type="button"
                    className="document-action-button document-action-primary"
                    onClick={() => {
                      setSharingDocument(document);
                      setShareEmail("");
                      setSharePermission("VIEW");
                      setShareExpiry(24);
                      setCreatedShare(null);
                      setMessage("");
                    }}
                  >
                    Share
                  </button>

                  <button
                    type="button"
                    className="document-action-button"
                    onClick={() => handlePreview(document)}
                    disabled={!supportsDocumentPreview(document)}
                    title={
                      supportsDocumentPreview(document)
                        ? undefined
                        : "Preview is unavailable for this file type."
                    }
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="document-action-button"
                    onClick={() => handleDownload(document)}
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    className="document-action-button delete-button"
                    onClick={() => handleDelete(document)}
                    disabled={deletingDocumentId === document.id}
                  >
                    {deletingDocumentId === document.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );

    // Reusable sharing-link list.
    const renderShareList = (shareList, historyMode = false) => (
      <div className="documents-list">
        {shareList.map((share) => {
          const state = getShareState(share);
          const documentName =
            share.document?.originalName || "Document unavailable";

          return (
            <article className="document-item" key={share.id}>
              <div className="document-details">
                <h4>{documentName}</h4>

                <p>
                  Recipient: {share.recipientEmail || "Not specified"}
                </p>

                <p>
                  Permission:{" "}
                  {formatSharePermission(share.permission)}
                </p>

                <small>
                  Created: {formatDate(share.createdAt)}
                </small>

                <small>
                  Expires: {formatDate(share.expiresAt)}
                </small>

                <p className="share-state-line">
                  Status:{" "}
                  <span
                    className={`share-status-badge share-status-${state.toLowerCase()}`}
                  >
                    {state === "ACTIVE"
                      ? "Active"
                      : state === "REVOKED"
                        ? "Revoked"
                        : state === "EXPIRED"
                          ? "Expired"
                          : "Document unavailable"}
                  </span>
                </p>
              </div>

              {!historyMode && state === "ACTIVE" && (
                <div className="document-actions">
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleRevokeShare(share)}
                  >
                    Revoke
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );

    return (
      <main className="dashboard-container">
        <header className="dashboard-header">
          <Link
            to="/home"
            className="brand dashboard-brand"
            aria-label="Go to DocuFortis home"
          >
            <span className="brand-icon">D</span>
            <span>DocuFortis</span>
            <small className="dashboard-brand-attribution">
              by Code Syndicate
            </small>
          </Link>

          <div className="user-info">
            <span>Welcome, {user.name}</span>

            <span className="security-note">
              {isPremium ? "PREMIUM" : "FREE"}
            </span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-label">WORKSPACE</div>

            {navLink("/", "Overview", "◈", "overview")}
            {navLink(
              "/dashboard/documents",
              "My Documents",
              "▤",
              "documents"
            )}
            {navLink(
              "/dashboard/sharing",
              "Shared Links",
              "↗",
              "sharing"
            )}

            <div className="sidebar-label">ACCOUNT</div>

            {navLink(
              "/dashboard/security",
              "Security",
              "⌑",
              "security"
            )}

            {navLink(
              "/dashboard/settings",
              "Settings",
              "⚙",
              "settings"
            )}

            <a
              href="/premium"
              className="dashboard-nav-link"
              onClick={(event) => {
                event.preventDefault();
                navigate("/premium");
              }}
            >
              <span>✦</span>
              Premium
            </a>

            <div className="sidebar-footer">
              <span className="sidebar-status-dot" />
              Your vault is protected
            </div>
          </aside>

          <section className="dashboard-content">
            <div className="dashboard-heading">
              <h2>{pageHeading[0]}</h2>
              <p>{pageHeading[1]}</p>
            </div>

            {message && !sharingDocument && (
              <p className="status-message" role="status">
                {message}
              </p>
            )}

            {sharingDocument && (
              <div
                className="share-dialog-backdrop"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget && !sharing) {
                    setSharingDocument(null);
                    setCreatedShare(null);
                    setShareEmail("");
                    setMessage("");
                  }
                }}
              >
                <section
                  ref={shareDialogRef}
                  className="share-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="share-dialog-title"
                  aria-describedby="share-dialog-description"
                  tabIndex={-1}
                >
                  <header className="share-dialog-header">
                    <div>
                      <span className="share-dialog-eyebrow">
                        SECURE SHARING
                      </span>
                      <h2 id="share-dialog-title">Share Document</h2>
                    </div>
                    <button
                      type="button"
                      className="share-dialog-close"
                      aria-label="Close sharing dialog"
                      disabled={sharing}
                      onClick={() => {
                        setSharingDocument(null);
                        setCreatedShare(null);
                        setShareEmail("");
                        setMessage("");
                      }}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </header>

                  <p
                    id="share-dialog-description"
                    className="share-dialog-document"
                  >
                    Document: <strong>{sharingDocument.originalName}</strong>
                  </p>

                  <div className="share-warning" role="note">
                    <strong>Save your link when it appears</strong>
                    <p>
                      The link is shown only once and cannot be retrieved
                      after this dialog is closed.
                    </p>
                  </div>

                  <form onSubmit={handleCreateShare}>
                    <div className="form-group">
                      <label htmlFor="shareEmail">Recipient Email</label>
                      <input
                        id="shareEmail"
                        type="email"
                        placeholder="Enter recipient's email"
                        value={shareEmail}
                        onChange={(event) =>
                          setShareEmail(event.target.value)
                        }
                        maxLength={254}
                        required
                      />
                    </div>

                    <div className="share-dialog-fields">
                      <div className="form-group">
                        <label htmlFor="sharePermission">Permission</label>
                        <select
                          id="sharePermission"
                          value={sharePermission}
                          onChange={(event) =>
                            setSharePermission(event.target.value)
                          }
                        >
                          <option value="VIEW">View only</option>
                          <option value="VIEW_AND_DOWNLOAD">
                            View and download
                          </option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="shareExpiry">Link Expiry</label>
                        <select
                          id="shareExpiry"
                          value={shareExpiry}
                          onChange={(event) =>
                            setShareExpiry(event.target.value)
                          }
                        >
                          <option value={1}>1 hour</option>
                          <option value={24}>24 hours</option>
                          <option value={72}>3 days</option>
                          <option value={168}>7 days</option>
                          <option value={720}>30 days</option>
                        </select>
                      </div>
                    </div>

                    <div className="share-dialog-actions">
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={sharing}
                      >
                        {sharing ? "Creating Link..." : "Create Sharing Link"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={sharing}
                        onClick={() => {
                          setSharingDocument(null);
                          setCreatedShare(null);
                          setShareEmail("");
                          setMessage("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                  {message && (
                    <p className="status-message" role="status">
                      {message}
                    </p>
                  )}

                  {createdShare && (
                    <div className="share-result">
                      <h3>Sharing Link Created</h3>
                      <p className="share-result-url">{createdShare.url}</p>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              createdShare.url
                            );
                            setMessage("Sharing link copied successfully.");
                          } catch {
                            setMessage(
                              "Unable to copy the link. Please copy it manually."
                            );
                          }
                        }}
                      >
                        Copy Link
                      </button>
                      <p>
                        Permission:{" "}
                        {formatSharePermission(createdShare.permission)}
                      </p>
                      <p>Expires: {formatDate(createdShare.expiresAt)}</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* OVERVIEW */}
            {dashboardPage === "overview" && (
              <>
                <section
                  id="storage"
                  className="upload-card storage-card"
                >
                  <div className="storage-heading">
                    <div>
                      <h3>Storage Usage</h3>
                      <p>{currentPlan} Plan</p>
                    </div>

                    {renderRefreshButton(
                      loadStorageUsage,
                      storageLoading,
                      "Refresh storage usage"
                    )}
                  </div>

                  {storageLoading && !storageUsage ? (
                    <p>Loading storage usage...</p>
                  ) : storageUsage ? (
                    <div
                      className="storage-usage-layout"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        flexWrap: "wrap",
                        marginTop: "18px",
                      }}
                    >
                      <div
                        className="storage-usage-ring"
                        role="progressbar"
                        aria-valuenow={storagePercentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label="Storage usage"
                        style={{
                          width: "132px",
                          height: "132px",
                          minWidth: "132px",
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: `conic-gradient(#167C72 ${storagePercentage}%, #F5E9C9 ${storagePercentage}% 100%)`,
                          boxShadow:
                            "0 8px 22px rgba(22, 124, 114, 0.12)",
                        }}
                      >
                        <div
                          className="storage-usage-ring-inner"
                          style={{
                            width: "104px",
                            height: "104px",
                            borderRadius: "50%",
                            background: "#FFFFFF",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            boxShadow:
                              "inset 0 0 0 1px rgba(22, 124, 114, 0.08)",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "25px",
                              lineHeight: 1.2,
                              color: "#174A45",
                            }}
                          >
                            {Math.round(storagePercentage)}%
                          </strong>

                          <span
                            style={{
                              fontSize: "12px",
                              color: "#687B77",
                            }}
                          >
                            Used
                          </span>
                        </div>
                      </div>

                      <div
                        className="storage-usage-details"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "9px",
                          flex: "1",
                          minWidth: "170px",
                        }}
                      >
                        <div className="storage-values">
                          <strong>
                            {(
                              storageUsage.usedBytes /
                              (1024 * 1024)
                            ).toFixed(2)}{" "}
                            MB used
                          </strong>

                          <span>
                            {(
                              storageUsage.limitBytes /
                              (1024 * 1024)
                            ).toFixed(0)}{" "}
                            MB total
                          </span>
                        </div>

                        <p>
                          {(
                            storageUsage.remainingBytes /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB remaining
                        </p>

                        <p className="security-note">
                          {storagePercentage >= 90
                            ? "Your storage is almost full. Consider managing your documents or upgrading your plan."
                            : storagePercentage >= 75
                              ? "You are using most of your available storage."
                              : "Your storage is within a healthy range."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p>Storage usage is currently unavailable.</p>
                  )}
                </section>

                <section id="upload" className="upload-card">
                  <h3>Upload Document</h3>

                  <p>
                    Upload a document securely to your DocuFortis vault.
                  </p>

                  <form onSubmit={handleUpload}>
                    <div className="form-group">
                      <label htmlFor="documentFile">
                        Select Document
                      </label>

                      <input
                        id="documentFile"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                        onChange={(event) =>
                          setSelectedFile(
                            event.target.files[0] || null
                          )
                        }
                        required
                      />
                    </div>

                    {selectedFile && (
                      <p className="security-note selected-file">
                        Selected: {selectedFile.name} ·{" "}
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={uploading || !selectedFile}
                    >
                      {uploading
                        ? "Uploading..."
                        : "Upload Document"}
                    </button>
                  </form>

                  <p className="security-note">
                    Maximum file size: 10 MB. Supported formats: PDF,
                    JPEG, PNG, WebP and TXT.
                  </p>
                </section>

                <section id="sharing" className="documents-section">
                  <div className="documents-heading">
                    <h3>
                      Active Sharing Links ({activeShares.length})
                    </h3>

                    {renderRefreshButton(
                      loadShares,
                      sharesLoading,
                      "Refresh sharing links"
                    )}
                  </div>

                  {sharesLoading ? (
                    <p>Loading sharing links...</p>
                  ) : activeShares.length === 0 ? (
                    <p className="empty-state">
                      You don't have any active sharing links right now.
                    </p>
                  ) : (
                    renderShareList(activeShares)
                  )}
                </section>

                {renderDocumentsList()}
              </>
            )}

            {/* DOCUMENTS */}
            {dashboardPage === "documents" && (
              <>{renderDocumentsList()}</>
            )}

            {/* SHARING */}
            {dashboardPage === "sharing" && (
              <>
                <section
                  id="active-sharing-links"
                  className="documents-section"
                >
                  <div className="documents-heading">
                    <h3>
                      Active Sharing Links ({activeShares.length})
                    </h3>

                    {renderRefreshButton(
                      loadShares,
                      sharesLoading,
                      "Refresh sharing links"
                    )}
                  </div>

                  {sharesLoading ? (
                    <p>Loading sharing links...</p>
                  ) : activeShares.length === 0 ? (
                    <p className="empty-state">
                      You don't have any active sharing links right now.
                    </p>
                  ) : (
                    renderShareList(activeShares)
                  )}
                </section>

                <section
                  id="sharing-history"
                  className="documents-section"
                >
                  <div className="documents-heading">
                    <h3>
                      Sharing History ({historicalShares.length})
                    </h3>
                  </div>

                  {sharesLoading ? (
                    <p>Loading sharing history...</p>
                  ) : historicalShares.length === 0 ? (
                    <p className="empty-state">
                      Revoked, expired and unavailable sharing links
                      will appear here.
                    </p>
                  ) : (
                    renderShareList(historicalShares, true)
                  )}
                </section>
              </>
            )}

            {/* SECURITY */}
            {dashboardPage === "security" && (
              <>
                <section id="security" className="upload-card">
                  <h3>Two-Factor Authentication (MFA)</h3>

                  {mfaRecoveryCodes.length > 0 ? (
                    <>
                      <p>
                        MFA has been enabled. Save these recovery codes
                        somewhere secure. Each code can only be used
                        once, and they will not be shown again.
                      </p>

                      <div className="recovery-codes">
                        {mfaRecoveryCodes.map((code, index) => (
                          <p key={index}>
                            <code>{code}</code>
                          </p>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              mfaRecoveryCodes.join("\n")
                            );

                            setMessage(
                              "Recovery codes copied successfully."
                            );
                          } catch {
                            setMessage(
                              "Unable to copy. Please save the codes manually."
                            );
                          }
                        }}
                      >
                        Copy All Recovery Codes
                      </button>

                      <button
                        type="button"
                        className="submit-button"
                        onClick={() => {
                          setMfaRecoveryCodes([]);
                          setUser(null);
                          setDocuments([]);
                          setShares([]);
                          setStorageUsage(null);
                          setMessage(
                            "MFA enabled. Please log in using your authenticator code."
                          );
                          setCaptchaToken("");
                          setWidgetKey((previous) => previous + 1);
                        }}
                      >
                        I Have Saved My Codes — Continue to Login
                      </button>
                    </>
                  ) : user.mfaEnabled ? (
                    <>
                      <p>
                        MFA is currently enabled on your account.
                      </p>

                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleMfaDisable();
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor="mfaPassword">
                            Current Password
                          </label>

                          <input
                            id="mfaPassword"
                            type="password"
                            value={mfaPassword}
                            onChange={(event) =>
                              setMfaPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="mfaVerificationCode">
                            Authenticator or Recovery Code
                          </label>

                          <input
                            id="mfaVerificationCode"
                            type="text"
                            value={mfaVerificationCode}
                            onChange={(event) =>
                              setMfaVerificationCode(event.target.value)
                            }
                            placeholder="Enter your verification code"
                            autoComplete="one-time-code"
                            maxLength={20}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="danger-outline-button"
                          disabled={mfaActionLoading}
                        >
                          {mfaActionLoading
                            ? "Disabling..."
                            : "Disable MFA"}
                        </button>
                      </form>
                    </>
                  ) : mfaEnrollment ? (
                    <>
                      <p>
                        Scan this QR code using Google Authenticator,
                        Microsoft Authenticator, or another compatible
                        authenticator app.
                      </p>

                      <img
                        src={mfaEnrollment.qrCode}
                        alt="MFA enrollment QR code"
                        className="mfa-qr-code"
                      />

                      <p>
                        Enter the six-digit code generated by your
                        authenticator app to confirm setup.
                      </p>

                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleMfaEnable();
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor="mfaEnrollmentCode">
                            Authenticator Code
                          </label>

                          <input
                            id="mfaEnrollmentCode"
                            type="text"
                            inputMode="numeric"
                            value={mfaEnrollmentCode}
                            onChange={(event) =>
                              setMfaEnrollmentCode(event.target.value)
                            }
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="submit-button"
                          disabled={
                            mfaActionLoading ||
                            mfaEnrollmentCode.trim().length !== 6
                          }
                        >
                          {mfaActionLoading
                            ? "Enabling..."
                            : "Confirm and Enable MFA"}
                        </button>
                      </form>

                      <p className="security-note">
                        Complete setup within the enrollment expiry period.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        MFA is currently disabled on your account.
                      </p>

                      <button
                        type="button"
                        className="submit-button"
                        onClick={handleMfaEnroll}
                        disabled={mfaActionLoading}
                      >
                        {mfaActionLoading
                          ? "Starting Setup..."
                          : "Set Up MFA"}
                      </button>
                    </>
                  )}
                </section>
              </>
            )}

            {/* SETTINGS */}
            {dashboardPage === "settings" && (
              <>
                <section className="upload-card">
                  <h3>Profile Information</h3>

                  <p>
                    Update your personal information associated with
                    your DocuFortis account.
                  </p>

                  {profileLoading ? (
                    <p>Loading account details...</p>
                  ) : (
                    <form onSubmit={handleProfileUpdate}>
                      <div className="form-group">
                        <label htmlFor="profileName">
                          Full Name
                        </label>

                        <input
                          id="profileName"
                          type="text"
                          value={profileName}
                          onChange={(event) =>
                            setProfileName(event.target.value)
                          }
                          minLength={2}
                          maxLength={80}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="profileEmail">
                          Registered Email
                        </label>

                        <input
                          id="profileEmail"
                          type="email"
                          value={profileEmail}
                          readOnly
                          disabled
                        />

                        <small className="security-note">
                          Your registered email cannot be edited here.
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="phoneCountryCode">
                          Phone Country Code (Optional)
                        </label>

                        <select
                          id="phoneCountryCode"
                          value={phoneCountryCode}
                          onChange={(event) =>
                            setPhoneCountryCode(event.target.value)
                          }
                        >
                          <option value="">Select country code</option>

                          {PHONE_COUNTRIES.map((country, index) => (
                            <option
                              key={`${country.name}-${index}`}
                              value={country.code}
                            >
                              {country.name} ({country.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="phoneNumber">
                          Phone Number (Optional)
                        </label>

                        <input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(event) =>
                            setPhoneNumber(event.target.value)
                          }
                          placeholder="Enter your phone number"
                          maxLength={20}
                        />
                      </div>

                      <button
                        type="submit"
                        className="submit-button"
                        disabled={profileSaving || profileLoading}
                      >
                        {profileSaving
                          ? "Saving Changes..."
                          : "Save Profile"}
                      </button>
                    </form>
                  )}
                </section>

                <section className="upload-card">
                  <h3>Change Password</h3>

                  <p>
                    Choose a strong password that you do not use on
                    other websites.
                  </p>

                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label htmlFor="currentPassword">
                        Current Password
                      </label>

                      <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(event) =>
                          setCurrentPassword(event.target.value)
                        }
                        autoComplete="current-password"
                        maxLength={128}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">
                        New Password
                      </label>

                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmNewPassword">
                        Confirm New Password
                      </label>

                      <input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(event) =>
                          setConfirmNewPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={passwordSaving}
                    >
                      {passwordSaving
                        ? "Changing Password..."
                        : "Change Password"}
                    </button>
                  </form>
                </section>

                <section className="upload-card">
                  <h3>Current Plan</h3>

                  <p>
                    Your account is currently on the{" "}
                    <strong>{currentPlan}</strong> plan.
                  </p>

                  <p>
                    {isPremium
                      ? "Your account has Premium storage access."
                      : "Your account currently uses the Free plan."}
                  </p>

                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => navigate("/premium")}
                  >
                    {isPremium
                      ? "View Premium Plan"
                      : "Explore Premium"}
                  </button>
                </section>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  // MFA verification interface.
  if (mfaChallengeToken) {
    return (
      <main className="auth-container auth-screen">
        <section className="auth-card auth-card--challenge">
          <Link to="/home" className="brand auth-brand">
            <span className="brand-icon">D</span>
            <span className="auth-brand-copy">
              <h1>DocuFortis</h1>
              <small>by Code Syndicate</small>
            </span>
          </Link>

          <h2 className="auth-heading">Two-Factor Authentication</h2>

          <p className="form-description">
            Enter the six-digit code from your authenticator app,
            or use one of your recovery codes.
          </p>

          <form className="auth-form" onSubmit={handleMfaVerify}>
            <div className="form-group">
              <label htmlFor="mfaCode">
                Authenticator or recovery code
              </label>

              <input
                id="mfaCode"
                type="text"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                placeholder="Enter your verification code"
                autoComplete="one-time-code"
                maxLength={20}
                required
                autoFocus
              />
            </div>

            {message && (
              <p className="status-message" role="status">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading || !mfaCode.trim()}
            >
              {loading ? "Verifying..." : "Verify and Login"}
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => {
                setMfaChallengeToken("");
                setMfaCode("");
                setPassword("");
                setCaptchaToken("");
                setMessage("");
                setWidgetKey((previous) => previous + 1);
              }}
            >
              Back to Login
            </button>
          </form>

          <p className="security-note">
            Your account is protected by two-factor authentication.
          </p>
        </section>
      </main>
    );
  }

  // Login and registration interface.
  return (
    <main className="auth-container auth-screen auth-split-screen">
      <aside className="auth-brand-panel" aria-label="DocuFortis introduction">
        <div className="auth-brand-panel-content">
          <Link to="/home" className="brand auth-brand">
            <span className="brand-icon">D</span>
            <span className="auth-brand-copy">
              <span className="auth-brand-name">DocuFortis</span>
              <small>by Code Syndicate</small>
            </span>
          </Link>

          <div className="auth-promo-copy">
            <span className="auth-promo-eyebrow">YOUR SECURE WORKSPACE</span>
            <h1>Your Documents.<br />Protected with Confidence.</h1>
            <p>
              Store, manage, and share documents in a cloud workspace
              designed to keep access under your control.
            </p>
          </div>

          <div className="auth-panel-accent" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </aside>

      <div className="auth-form-panel">
        <section
          className={`auth-card ${isLogin ? "auth-card--login" : "auth-card--register"}`}
        >
          <div className="auth-tabs">
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => switchAuthMode(true)}
            >
              Login
            </button>

            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => switchAuthMode(false)}
            >
              Register
            </button>
          </div>

          <h2 className="auth-heading">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>

          <p className="form-description">
            {isLogin
              ? "Log in to access your secure documents."
              : "Create an account to get started with DocuFortis."}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full name</label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                autoComplete={
                  isLogin ? "current-password" : "new-password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isLogin ? 1 : 8}
                maxLength={128}
                required
              />
            </div>

            {isLogin && (
              <div className="forgot-password-link">
                <a href="/forgot-password">Forgot Password?</a>
              </div>
            )}

            <div className="captcha-container auth-captcha">
              {siteKey ? (
                <Turnstile
                  key={widgetKey}
                  siteKey={siteKey}
                  options={{
                    action: "authentication",
                  }}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => {
                    setCaptchaToken("");
                    setMessage(
                      "CAPTCHA could not load. Please try again."
                    );
                  }}
                />
              ) : (
                <p className="error-message">
                  CAPTCHA site key is missing.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading || !siteKey}
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Login to DocuFortis"
                  : "Create Account"}
            </button>
          </form>

          <div className="google-login-divider">
            <span>OR</span>
          </div>

          <div className="google-login-container auth-google-control">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setMessage(
                  "Google sign-in was unsuccessful. Please try again."
                );
              }}
              text="continue_with"
              theme="outline"
              shape="rectangular"
              size="large"
              width="320"
            />
          </div>

          {message && (
            <p className="status-message" role="status">
              {message}
            </p>
          )}

          <p className="security-note">
            Your documents. Your control. Your security.
          </p>
        </section>
      </div>
    </main>
  );
}

export default App;
