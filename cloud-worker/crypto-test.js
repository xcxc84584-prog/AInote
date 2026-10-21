export default {
  async fetch() {
    try {
      const encoder = new TextEncoder();

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode("test-password-123456"),
        "PBKDF2",
        false,
        ["deriveBits"]
      );

      const bits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: encoder.encode("test-salt-123456"),
          iterations: 310000,
          hash: "SHA-256"
        },
        key,
        256
      );

      return Response.json({
        ok: true,
        derivedBytes: bits.byteLength
      });
    } catch (e) {
      return Response.json({
        ok: false,
        name: e.name,
        message: e.message
      });
    }
  }
};
