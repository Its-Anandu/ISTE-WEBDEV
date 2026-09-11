import QRCode from 'qrcode';

export interface UpiQrParams {
  amount: number;
  transactionRef: string;
  note?: string;
}

/**
 * Generates a UPI deep link string and converts it into a base64 PNG Data URL QR code.
 */
export async function generateUpiQrDataUrl({
  amount,
  transactionRef,
  note,
}: UpiQrParams): Promise<string> {
  const upiId = process.env.UPI_ID || 'istembcet@upi';
  const payeeName = process.env.UPI_PAYEE_NAME || 'ISTE SC MBCET';

  const noteText = note || `RegID ${transactionRef.slice(0, 8)}`;

  // Construct UPI deep link URI
  // Format: upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  // Convert to Base64 PNG Data URL
  const qrDataUrl = await QRCode.toDataURL(upiUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#1c1915', // Matches primary theme ink
      light: '#ffffff',
    },
  });

  return qrDataUrl;
}
