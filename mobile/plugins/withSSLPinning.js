/**
 * Expo Config Plugin for SSL Certificate Pinning
 *
 * This plugin configures SSL pinning for Android builds.
 * For iOS, pinning is typically handled via ATS (App Transport Security) or TrustKit.
 *
 * Usage in app.json:
 * {
 *   "plugins": [
 *     ["./plugins/withSSLPinning", {
 *       "domains": ["sous.projcomfort.com"],
 *       "pins": ["YOUR_SHA256_HASH_1", "YOUR_SHA256_HASH_2"]
 *     }]
 *   ]
 * }
 */

const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Generate network_security_config.xml content
 */
function generateNetworkSecurityConfig(domains, pins, expiration = "2026-12-31") {
  const domainConfigs = domains
    .map(
      (domain) => `
    <domain-config cleartextTrafficPermitted="false">
      <domain includeSubdomains="true">${domain}</domain>
      <pin-set expiration="${expiration}">
        ${pins.map((pin) => `<pin digest="SHA-256">${pin}</pin>`).join("\n        ")}
      </pin-set>
    </domain-config>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- Base config: trust system CAs -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>

  <!-- Debug config: also trust user-installed CAs for development -->
  <debug-overrides>
    <trust-anchors>
      <certificates src="user" />
    </trust-anchors>
  </debug-overrides>
  ${domainConfigs}
</network-security-config>`;
}

/**
 * Add network security config to Android
 */
const withNetworkSecurityConfig = (config, { domains = [], pins = [] }) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res"
      );

      // Create xml directory if it doesn't exist
      const xmlPath = path.join(resPath, "xml");
      if (!fs.existsSync(xmlPath)) {
        fs.mkdirSync(xmlPath, { recursive: true });
      }

      // Write network_security_config.xml
      const configContent = generateNetworkSecurityConfig(domains, pins);
      fs.writeFileSync(
        path.join(xmlPath, "network_security_config.xml"),
        configContent
      );

      console.log("[withSSLPinning] Created network_security_config.xml");

      return config;
    },
  ]);
};

/**
 * Reference network security config in AndroidManifest.xml
 */
const withNetworkSecurityConfigManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Get the application element
    const application = androidManifest.manifest.application?.[0];

    if (application) {
      // Add network security config reference
      application.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }

    return config;
  });
};

/**
 * Main plugin function
 */
module.exports = function withSSLPinning(config, options = {}) {
  const {
    domains = ["sous.projcomfort.com"],
    pins = [
      // Let's Encrypt ISRG Root X1 (commonly used)
      "C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",
    ],
  } = options;

  // Skip if no pins provided
  if (pins.length === 0) {
    console.warn("[withSSLPinning] No certificate pins provided, skipping");
    return config;
  }

  // Apply Android modifications
  config = withNetworkSecurityConfig(config, { domains, pins });
  config = withNetworkSecurityConfigManifest(config);

  return config;
};
