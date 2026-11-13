
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Premium.css";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export default function PremiumCheckout() {
  const navigate = useNavigate();
  const checkoutRef = useRef(null);
  const confirmationDialogRef = useRef(null);
  const paymentButtonRef = useRef(null);

  const [request, setRequest] = useState(null);

  // Demo card fields remain on the frontend only.
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [network, setNetwork] = useState("VISA");

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!showPaymentModal) return undefined;

    const checkout = checkoutRef.current;
    const paymentButton = paymentButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousInert = checkout?.inert ?? false;
    const previousAriaHidden = checkout?.getAttribute("aria-hidden");

    if (checkout) {
      checkout.inert = true;
      checkout.setAttribute("aria-hidden", "true");
    }

    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      confirmationDialogRef.current
        ?.querySelector("button:not([disabled])")
        ?.focus();
    });

    function handleDialogKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowPaymentModal(false);
        return;
      }

      if (event.key !== "Tab" || !confirmationDialogRef.current) return;

      const focusableElements =
        confirmationDialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (
        !confirmationDialogRef.current.contains(document.activeElement) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        firstElement.focus();
      } else if (
        !confirmationDialogRef.current.contains(document.activeElement) &&
        event.shiftKey
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;

      if (checkout) {
        checkout.inert = previousInert;
        if (previousAriaHidden === null) {
          checkout.removeAttribute("aria-hidden");
        } else {
          checkout.setAttribute("aria-hidden", previousAriaHidden);
        }
      }

      if (paymentButton?.isConnected) {
        paymentButton.focus();
      } else {
        checkout?.focus();
      }
    };
  }, [showPaymentModal]);

  const order = request?.paymentOrder;
  const digits = cardNumber.replace(/\D/g, "");
  const premiumBrand = (
    <Link
      to="/home"
      className="premium-brand"
      aria-label="DocuFortis by Code Syndicate home"
    >
      <span className="premium-brand-mark">D</span>
      <span>
        <strong>DocuFortis</strong>
        <small>by Code Syndicate</small>
      </span>
    </Link>
  );

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await fetch(
          `${API_URL}/api/upgrades/my-request`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your payment order."
          );
        }

        if (!data.request?.paymentOrder) {
          throw new Error(
            "No Premium payment order was found. Please select a plan first."
          );
        }

        setRequest(data.request);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, []);

  function validateForm() {
    if (!cardholder.trim()) {
      return "Enter the cardholder name.";
    }

    if (digits.length < 12 || digits.length > 19) {
      return "Enter a valid demo card number.";
    }

    if (!["VISA", "RUPAY"].includes(network)) {
      return "Select a valid card network.";
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return "Enter the expiry date in MM/YY format.";
    }

    const [month, year] = expiry.split("/").map(Number);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear() % 100;

    if (
      month < 1 ||
      month > 12 ||
      year < currentYear ||
      (year === currentYear && month < currentMonth)
    ) {
      return "Enter a valid future expiry date.";
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return "Enter a valid 3 or 4 digit CVV.";
    }

    return "";
  }

  async function handlePayment(demoOutcome) {
    setShowPaymentModal(false);
    setProcessing(true);
    setError("");
    setResult(null);

    if (!request?.id || !order?.id) {
      setError("Payment order is unavailable.");
      setProcessing(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/upgrades/${request.id}/payment`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

          // Never transmit card number, expiry or CVV.
          body: JSON.stringify({
            demoOutcome,
            cardNetwork: network,
            cardLast4: digits.slice(-4),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to process demo payment."
        );
      }

      setResult(data.payment);

      if (data.payment.status === "SUCCESS") {
        setRequest((previous) => ({
          ...previous,
          paymentStatus: "SUCCESS",
          paymentOrder: {
            ...previous.paymentOrder,
            status: "PAID",
          },
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <main className="premium-page">
        <div className="premium-container premium-checkout premium-checkout-state">
          {premiumBrand}
          <div className="premium-state-card" role="status">
            <span className="premium-spinner" aria-hidden="true" />
            <p>Loading your demonstration checkout...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="premium-page">
        <div className="premium-container premium-checkout">
          {premiumBrand}
          <section
            className="premium-state-card premium-checkout-error"
            role="alert"
          >
            <span className="premium-eyebrow">CHECKOUT UNAVAILABLE</span>
            <h1>Unable to open checkout</h1>
            <p className="premium-error">{error}</p>

            <button
              className="premium-pay-button"
              onClick={() => navigate("/premium")}
            >
              Back to Premium Plans
            </button>
          </section>
        </div>
      </main>
    );
  }

  const paymentCompleted =
    order?.status === "PAID" ||
    request?.paymentStatus === "SUCCESS";

  return (
    <main className="premium-page">
      <div
        ref={checkoutRef}
        className="premium-container premium-checkout"
        tabIndex={-1}
      >
        {premiumBrand}
        <button
          className="premium-back"
          onClick={() => navigate("/premium")}
          disabled={processing}
        >
          ← Back to Plans
        </button>

        <header className="premium-heading premium-checkout-heading">
          <span className="premium-eyebrow">
            PREMIUM UPGRADE · DEMO CHECKOUT
          </span>

          <h1>Complete your Premium upgrade</h1>

          <p>
            Review your order summary and continue with the demonstration
            checkout.
          </p>
        </header>

        <div className="premium-checkout-grid">
          <section className="premium-order">
            <div className="premium-order-heading">
              <span className="premium-plan-label">YOUR UPGRADE</span>
              <h2>Order summary</h2>
            </div>

            <div className="premium-order-details">
              <div>
                <span>Premium storage</span>
                <strong>90 MB</strong>
              </div>

              <div>
                <span>Amount</span>
                <strong className="premium-order-amount">
                  ₹{(order?.amountPaise / 100).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Currency</span>
                <strong>{order?.currency}</strong>
              </div>

              <div>
                <span>Order number</span>
                <strong>{order?.orderNumber}</strong>
              </div>
            </div>

            <div className="premium-order-note">
              <span aria-hidden="true">✦</span>
              <p>Premium access is enabled after administrator approval.</p>
            </div>
          </section>

          {paymentCompleted ? (
            <section className="premium-result premium-success premium-result-card">
              <span className="premium-result-icon" aria-hidden="true">✓</span>
              <span className="premium-plan-label">DEMO PAYMENT COMPLETE</span>
              <h2>Upgrade request submitted</h2>
              <p>
                Your demonstration payment has been recorded. Your Premium
                upgrade is awaiting administrator approval.
              </p>

              {result?.reference && (
                <p>
                  Payment reference:{" "}
                  <code>{result.reference}</code>
                </p>
              )}

              <button onClick={() => navigate("/")}>
                Return to Dashboard
              </button>
            </section>
          ) : (
            <section className="premium-payment-card">
              <div className="premium-payment-heading">
                <div>
                  <span className="premium-plan-label">DEMO EXPERIENCE</span>
                  <h2>Payment details</h2>
                </div>
                <span className="premium-payment-mark" aria-hidden="true">D</span>
              </div>

              <p className="premium-demo-warning">
                DEMONSTRATION ONLY — This is not a real payment. No real
                payment gateway or processor is connected, and no real
                payment or card charge occurs. Use fictional test details;
                never enter real card information.
              </p>

              <label htmlFor="cardholder">
                Cardholder name
              </label>

              <input
                id="cardholder"
                type="text"
                placeholder="Name on card"
                value={cardholder}
                maxLength={80}
                autoComplete="off"
                disabled={processing}
                onChange={(e) => setCardholder(e.target.value)}
              />

              <label htmlFor="card-number">Card number</label>

              <div className="premium-card-number-field">
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  autoComplete="off"
                  disabled={processing}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                />
                <strong>
                  {digits.length ? network : "CARD"}
                </strong>
              </div>

              <label htmlFor="card-network">Card network</label>

              <select
                id="card-network"
                value={network}
                disabled={processing}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="VISA">Visa</option>
                <option value="RUPAY">RuPay</option>
              </select>

              <div className="premium-card-fields">
                <div>
                  <label htmlFor="card-expiry">Expiry date</label>
                  <input
                    id="card-expiry"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiry}
                    autoComplete="off"
                    disabled={processing}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);

                      setExpiry(
                        value.length > 2
                          ? `${value.slice(0, 2)}/${value.slice(2)}`
                          : value
                      );
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="card-cvv">CVV</label>
                  <input
                    id="card-cvv"
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    maxLength={4}
                    value={cvv}
                    autoComplete="off"
                    disabled={processing}
                    onChange={(e) =>
                      setCvv(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                  />
                </div>
              </div>

              <p className="premium-card-note">
                Card details stay in this page only. Only the selected
                simulated outcome, card network and last four digits
                are sent to the server. No real payment is processed.
              </p>

              {error && (
                <p className="premium-error">{error}</p>
              )}

              {result?.status === "FAILED" && (
                <div className="premium-result premium-failure">
                  <h3>Payment declined</h3>

                  <p>
                    The demonstration transaction was declined.
                    You can try again.
                  </p>

                  <p>
                    Transaction:{" "}
                    <code>{result.transactionNumber}</code>
                  </p>
                </div>
              )}

              <button
                ref={paymentButtonRef}
                className="premium-pay-button"
                onClick={() => {
                  const validationError = validateForm();

                  if (validationError) {
                    setError(validationError);
                    return;
                  }

                  setError("");
                  setShowPaymentModal(true);
                }}
                disabled={processing}
              >
                {processing
                  ? "Processing demonstration payment..."
                  : `Pay ₹${(order?.amountPaise / 100).toFixed(2)}`}
              </button>

              {processing && (
                <div className="premium-processing">
                  <span className="premium-spinner" />

                  <p>
                    Processing your demonstration transaction...
                  </p>
                </div>
              )}

            </section>
          )}
        </div>

        <p className="premium-disclaimer">
          This is a simulated payment experience, not a real
          payment gateway. Premium access requires administrator
          approval. No subscription or automatic renewal is created.
        </p>

      </div>

      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div
            ref={confirmationDialogRef}
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            aria-describedby="payment-modal-description"
            tabIndex={-1}
          >
            <div className="payment-modal-icon">
              ₹
            </div>

            <h2 id="payment-modal-title">
              Confirm Demo Payment
            </h2>

            <p id="payment-modal-description">
              Choose the simulated result for your
              ₹{(order?.amountPaise / 100).toFixed(2)} transaction.
            </p>

            <div className="payment-modal-actions">

              <button
                className="payment-approve"
                onClick={() => handlePayment("SUCCESS")}
              >
                Approve Payment
              </button>

              <button
                className="payment-decline"
                onClick={() => handlePayment("FAILED")}
              >
                Decline Payment
              </button>

            </div>

            <button
              className="payment-modal-cancel"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </button>

            <small>
              Demo simulation only. No real payment is made.
            </small>
          </div>
        </div>
      )}

    </main>
  );
}
