/**
 * Legal Links Component
 * Displays privacy policy and terms of service links
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "../styles/theme";
import { linkA11y } from "../utils/accessibility";

// URLs for legal documents
const LEGAL_URLS = {
  privacyPolicy: "https://sous.projcomfort.com/privacy",
  termsOfService: "https://sous.projcomfort.com/terms",
  cookiePolicy: "https://sous.projcomfort.com/cookies",
  support: "https://sous.projcomfort.com/support",
  contact: "mailto:support@sous.projcomfort.com",
};

interface LegalLinkItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  url: string;
  description?: string;
}

const LegalLinkItem: React.FC<LegalLinkItemProps> = ({
  icon,
  title,
  url,
  description,
}) => {
  const handlePress = async () => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("[LegalLinks] Failed to open URL:", url, error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.linkItem}
      onPress={handlePress}
      {...linkA11y(title, `Opens ${title.toLowerCase()} in browser`)}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={22} color={colors.olive} />
      </View>
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle}>{title}</Text>
        {description && <Text style={styles.linkDescription}>{description}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

interface LegalLinksProps {
  showHeader?: boolean;
  showSupport?: boolean;
}

const LegalLinks: React.FC<LegalLinksProps> = ({
  showHeader = true,
  showSupport = true,
}) => {
  return (
    <View style={styles.container}>
      {showHeader && (
        <Text style={styles.sectionHeader}>Legal & Support</Text>
      )}

      <View style={styles.linksContainer}>
        <LegalLinkItem
          icon="document-text-outline"
          title="Privacy Policy"
          url={LEGAL_URLS.privacyPolicy}
          description="How we handle your data"
        />

        <View style={styles.divider} />

        <LegalLinkItem
          icon="reader-outline"
          title="Terms of Service"
          url={LEGAL_URLS.termsOfService}
          description="Rules for using our app"
        />

        {showSupport && (
          <>
            <View style={styles.divider} />

            <LegalLinkItem
              icon="help-circle-outline"
              title="Help & Support"
              url={LEGAL_URLS.support}
              description="Get help with the app"
            />

            <View style={styles.divider} />

            <LegalLinkItem
              icon="mail-outline"
              title="Contact Us"
              url={LEGAL_URLS.contact}
              description="Send us feedback"
            />
          </>
        )}
      </View>

      <Text style={styles.footerText}>
        By using Sous, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
};

/**
 * Compact version for settings footer
 */
export const LegalLinksCompact: React.FC = () => {
  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("[LegalLinks] Failed to open URL:", url, error);
    }
  };

  return (
    <View style={styles.compactContainer}>
      <TouchableOpacity
        onPress={() => openUrl(LEGAL_URLS.privacyPolicy)}
        {...linkA11y("Privacy Policy")}
      >
        <Text style={styles.compactLink}>Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.compactDivider}>|</Text>

      <TouchableOpacity
        onPress={() => openUrl(LEGAL_URLS.termsOfService)}
        {...linkA11y("Terms of Service")}
      >
        <Text style={styles.compactLink}>Terms of Service</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  linksContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.olive}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  linkDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 40 + spacing.md,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    lineHeight: 18,
  },
  compactContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  compactLink: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
  },
  compactDivider: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginHorizontal: spacing.sm,
  },
});

export default LegalLinks;
