
import fs from "node:fs/promises";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({ input: stdin, output: stdout });

try {
  const dataUrl = await rl.question("Paste the complete QR data URL: ");

  const match = dataUrl.match(
    /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    throw new Error("Invalid PNG data URL. Check that you copied the complete QR code value.");
  }

  const imageBuffer = Buffer.from(match[1], "base64");

  if (imageBuffer.length < 100) {
    throw new Error("The QR image data appears incomplete.");
  }

  await fs.writeFile("mfa-enrollment-qr.png", imageBuffer);

  console.log("QR image successfully saved as mfa-enrollment-qr.png");
} catch (error) {
  console.error("Could not create QR image:", error.message);
} finally {
  rl.close();
}
