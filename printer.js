import pkg from "node-thermal-printer";
const { ThermalPrinter, types } = pkg;
import { spawn } from "child_process";
import fs from "fs";

const CUPS_NAME = "XP58";    // change to your CUPS name
const DEV_PATH = "/dev/usb/lp0";

async function tryPrinterInterface(interfaceStr) {
  // Set the printer driver first
  ThermalPrinter.setPrinterDriver(types.EPSON);
  
  const p = new ThermalPrinter({
    type: types.EPSON,
    interface: interfaceStr,
    characterSet: "PC852",
    removeSpecialCharacters: false,
  });

  try {
    // Some versions of the lib provide isPrinterConnected; some don't.
    if (typeof p.isPrinterConnected === "function") {
      const ok = await p.isPrinterConnected();
      console.log(`[${interfaceStr}] isPrinterConnected():`, ok);
      if (!ok) throw new Error("not connected (reported)");
    }

    p.clear();
    p.alignCenter();
    p.println("=== TEST PRINT ===");
    p.println(`Interface: ${interfaceStr}`);
    p.newLine();
    p.println("Hello XP-58!");
    p.cut();
    await p.execute();
    console.log(`✅ Printed via ${interfaceStr}`);
    return true;
  } catch (err) {
    console.warn(`❌ Failed printing via ${interfaceStr}:`, err?.message || err);
    return false;
  }
}

async function fallbackLp(text) {
  try {
    const tmp = "/tmp/receipt.txt";
    fs.writeFileSync(tmp, text);
    await new Promise((resolve, reject) => {
      const lp = spawn("lp", ["-d", CUPS_NAME, tmp]);
      lp.on("close", (code) => (code === 0 ? resolve() : reject(new Error("lp exit code " + code))));
      lp.on("error", (e) => reject(e));
    });
    console.log("✅ Printed via lp fallback");
    return true;
  } catch (err) {
    console.error("❌ lp fallback failed:", err?.message || err);
    return false;
  }
}

(async () => {
  console.log("Trying CUPS queue...");
  if (await tryPrinterInterface(`printer:${CUPS_NAME}`)) return;

  console.log("Trying direct device...");
  if (await tryPrinterInterface(DEV_PATH)) return;

  console.log("Trying lp fallback...");
  await fallbackLp("=== TEST PRINT ===\nPrinted by lp fallback\n\n\n");
})();
