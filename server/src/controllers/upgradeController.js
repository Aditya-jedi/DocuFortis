
import prisma from "../config/database.js";
import { randomUUID } from "crypto";

// Fixed promotional prices. Amounts are stored in paise.
const PRICING_OPTIONS = {
  MONTHLY: 9900,
  YEARLY: 99900,
};

// Supported networks for demonstration payments.
const SUPPORTED_CARD_NETWORKS = ["VISA", "RUPAY"];

function generateOrderNumber() {
  return `DF-ORD-${Date.now()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function generateTransactionNumber() {
  return `DF-TXN-${Date.now()}-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
}

function generatePaymentReference() {
  return `DF-REF-${randomUUID().toUpperCase()}`;
}

async function createPaymentOrder(
  tx,
  userId,
  upgradeRequestId,
  amountPaise
) {
  return tx.paymentOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      upgradeRequestId,
      amountPaise,
      currency: "INR",
      status: "PENDING",
    },
    include: {
      transactions: true,
    },
  });
}

export async function createUpgradeRequest(req, res) {
  try {
    if (req.user.plan === "PREMIUM") {
      return res.status(400).json({
        success: false,
        message: "Your account is already on the Premium plan.",
      });
    }

    const { pricingOption } = req.body;

    if (
      !pricingOption ||
      !Object.hasOwn(PRICING_OPTIONS, pricingOption)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid Premium pricing option.",
      });
    }

    const amountPaise = PRICING_OPTIONS[pricingOption];

    const result = await prisma.$transaction(async (tx) => {
      const existingRequest = await tx.upgradeRequest.findFirst({
        where: {
          userId: req.user.id,
          status: "PENDING",
        },
        include: {
          paymentOrder: {
            include: {
              transactions: {
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingRequest) {
        if (existingRequest.paymentStatus === "SUCCESS") {
          return {
            conflict: true,
            message:
              "Your payment is already successful and awaiting admin approval.",
            request: existingRequest,
          };
        }

        if (existingRequest.paymentOrder) {
          return {
            conflict: false,
            existing: true,
            request: existingRequest,
          };
        }

        // Compatibility with older requests without payment orders.
        const order = await createPaymentOrder(
          tx,
          req.user.id,
          existingRequest.id,
          amountPaise
        );

        return {
          conflict: false,
          existing: true,
          request: {
            ...existingRequest,
            paymentOrder: order,
          },
        };
      }

      const request = await tx.upgradeRequest.create({
        data: {
          userId: req.user.id,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
      });

      const order = await createPaymentOrder(
        tx,
        req.user.id,
        request.id,
        amountPaise
      );

      await tx.auditEvent.create({
        data: {
          userId: req.user.id,
          action: "PAYMENT_ORDER_CREATED",
          ipAddress: req.ip,
          userAgent: req.get("user-agent") || null,
        },
      });

      return {
        conflict: false,
        existing: false,
        request: {
          ...request,
          paymentOrder: order,
        },
      };
    });

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: result.message,
        request: result.request,
      });
    }

    return res.status(result.existing ? 200 : 201).json({
      success: true,
      message: result.existing
        ? "Your existing Premium order has been retrieved."
        : "Premium upgrade request and payment order created.",
      request: result.request,
    });
  } catch (error) {
    console.error("Upgrade request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create Premium payment order.",
    });
  }
}

export async function simulatePayment(req, res) {
  try {
    const { requestId } = req.params;
    const { demoOutcome, cardNetwork, cardLast4 } = req.body;

    // Validate demonstration payment information.
    if (
      !["SUCCESS", "FAILED"].includes(demoOutcome) ||
      !SUPPORTED_CARD_NETWORKS.includes(cardNetwork) ||
      typeof cardLast4 !== "string" ||
      !/^\d{4}$/.test(cardLast4)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid demonstration payment details.",
      });
    }

    // These are simulated results, not real card transactions.
    const demoCard = {
      status: demoOutcome,
      network: cardNetwork,
      last4: cardLast4,
      failureCode:
        demoOutcome === "FAILED" ? "DEMO_DECLINED" : null,
      failureMessage:
        demoOutcome === "FAILED"
          ? "The demonstration payment was declined."
          : null,
    };

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.upgradeRequest.findFirst({
        where: {
          id: requestId,
          userId: req.user.id,
          status: "PENDING",
        },
        include: {
          paymentOrder: true,
        },
      });

      if (!request || !request.paymentOrder) {
        return {
          error: "NOT_FOUND",
        };
      }

      const order = request.paymentOrder;

      if (order.status !== "PENDING") {
        return {
          error: "ALREADY_PAID",
        };
      }

      const now = new Date();
      const transactionNumber = generateTransactionNumber();
      const providerReference = generatePaymentReference();

      const paymentStatus = demoCard.status;

      const transaction = await tx.paymentTransaction.create({
        data: {
          transactionNumber,
          orderId: order.id,
          provider: "DOCUFORTIS_DEMO",
          providerReference,
          amountPaise: order.amountPaise,
          currency: order.currency,
          status: paymentStatus,
          paymentMethod: "CARD",
          cardNetwork: demoCard.network,
          cardLast4: demoCard.last4,
          failureCode: demoCard.failureCode,
          failureMessage: demoCard.failureMessage,
          processedAt: now,
        },
      });

      if (paymentStatus === "SUCCESS") {
        await tx.paymentOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: "PAID",
            paidAt: now,
          },
        });
      }

      await tx.upgradeRequest.update({
        where: {
          id: request.id,
        },
        data: {
          paymentStatus,
          paymentReference: providerReference,
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: req.user.id,
          action:
            paymentStatus === "SUCCESS"
              ? "PAYMENT_SUCCEEDED"
              : "PAYMENT_FAILED",
          ipAddress: req.ip,
          userAgent: req.get("user-agent") || null,
        },
      });

      return {
        transaction,
        paymentStatus,
        orderNumber: order.orderNumber,
      };
    });

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Pending upgrade request or payment order not found.",
      });
    }

    if (result.error === "ALREADY_PAID") {
      return res.status(409).json({
        success: false,
        message: "This payment order has already been paid.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        result.paymentStatus === "SUCCESS"
          ? "Demo payment successful. Awaiting admin approval."
          : "Demo payment declined. You can retry with another demo card.",
      payment: {
        status: result.paymentStatus,
        orderNumber: result.orderNumber,
        transactionNumber: result.transaction.transactionNumber,
        reference: result.transaction.providerReference,
        amountPaise: result.transaction.amountPaise,
        currency: result.transaction.currency,
        paymentMethod: result.transaction.paymentMethod,
        cardNetwork: result.transaction.cardNetwork,
        cardLast4: result.transaction.cardLast4,
        simulated: true,
      },
    });
  } catch (error) {
    console.error("Demo payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process demo payment.",
    });
  }
}

export async function getMyUpgradeRequest(req, res) {
  try {
    const request = await prisma.upgradeRequest.findFirst({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        paymentOrder: {
          include: {
            transactions: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("My upgrade request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your upgrade request.",
    });
  }
}
