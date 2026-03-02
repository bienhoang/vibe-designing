/** Base64 encode a Uint8Array (works in Figma plugin sandbox where btoa may not exist). */
export function customBase64Encode(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";

  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  for (let i = 0; i < mainLength; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    base64 +=
      chars[(chunk & 16515072) >> 18] +
      chars[(chunk & 258048) >> 12] +
      chars[(chunk & 4032) >> 6] +
      chars[chunk & 63];
  }

  if (byteRemainder === 1) {
    const chunk = bytes[mainLength];
    base64 += chars[(chunk & 252) >> 2] + chars[(chunk & 3) << 4] + "==";
  } else if (byteRemainder === 2) {
    const chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    base64 +=
      chars[(chunk & 64512) >> 10] +
      chars[(chunk & 1008) >> 4] +
      chars[(chunk & 15) << 2] +
      "=";
  }

  return base64;
}

/** Base64 decode a string to Uint8Array (works in Figma plugin sandbox where atob may not exist). */
export function customBase64Decode(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(128);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  // Strip padding and calculate output length
  let stripped = base64.replace(/=+$/, "");
  const byteLength = (stripped.length * 3) >> 2;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < stripped.length; i += 4) {
    const a = lookup[stripped.charCodeAt(i)];
    const b = i + 1 < stripped.length ? lookup[stripped.charCodeAt(i + 1)] : 0;
    const c = i + 2 < stripped.length ? lookup[stripped.charCodeAt(i + 2)] : 0;
    const d = i + 3 < stripped.length ? lookup[stripped.charCodeAt(i + 3)] : 0;
    bytes[p++] = (a << 2) | (b >> 4);
    if (p < byteLength) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < byteLength) bytes[p++] = ((c & 3) << 6) | d;
  }

  return bytes;
}
