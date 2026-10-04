/**
 * Proves to Android that the Play Store app and this website belong together, so the
 * app opens full-screen without a browser address bar. Set both variables on the host
 * once the Android app has been generated:
 *   ANDROID_PACKAGE  e.g. app.ogarider.twa
 *   ANDROID_SHA256   the signing certificate fingerprint (comma-separated if several)
 */
export async function GET() {
  const pkg = process.env.ANDROID_PACKAGE;
  const fingerprints = (process.env.ANDROID_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const body =
    pkg && fingerprints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: pkg,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : [];
  return Response.json(body);
}
