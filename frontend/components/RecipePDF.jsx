
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const C = {
  orange: "#EA580C",
  orangeLight: "#FFF4E9",
  dark: "#1C1917",
  text: "#44403C",
  muted: "#78716C",
  border: "#E7E5E4",
  cream: "#FAF9F6",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    color: C.dark,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 67,
    paddingBottom: 66,
    paddingHorizontal: 42,
  },

  cover: {
    backgroundColor: C.white,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    color: C.dark,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35,
  },

  logo: {
    width: 105,
    height: 42,
    objectFit: "contain",
  },

  smallLabel: {
    color: C.orange,
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  eyebrow: {
    color: C.orange,
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 10,
  },

  coverTitle: {
    fontSize: 34,
    lineHeight: 1.13,
    fontWeight: "bold",
    marginBottom: 12,
    color: C.dark,
  },

  description: {
    fontSize: 10,
    lineHeight: 1.7,
    color: C.muted,
    marginBottom: 20,
  },

  hero: {
    width: "100%",
    height: 255,
    objectFit: "cover",
    borderRadius: 9,
  },

  imageFallback: {
    height: 255,
    backgroundColor: C.orangeLight,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  fallbackText: {
    color: C.orange,
    fontSize: 11,
    letterSpacing: 2,
  },

  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    marginTop: 19,
    marginBottom: 17,
  },

  metaItem: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderColor: C.border,
  },

  metaFirst: {
    paddingLeft: 0,
    borderLeftWidth: 0,
  },

  metaLabel: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },

  metaValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.dark,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  tag: {
    backgroundColor: C.orangeLight,
    color: C.orange,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 8,
    marginRight: 7,
    marginBottom: 5,
  },

  coverClosing: {
    marginTop: 24,
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1.5,
  },

  // Repeating header and footer
  header: {
    position: "absolute",
    top: 25,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLogo: {
    width: 72,
    height: 28,
    objectFit: "contain",
  },

  headerText: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: C.muted,
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerBrand: {
    fontSize: 8,
    color: C.orange,
    fontWeight: "bold",
  },

  footerText: {
    fontSize: 7,
    color: C.muted,
  },

  watermark: {
    position: "absolute",
    bottom: 48,
    right: 42,
    color: C.orange,
    opacity: 0.10,
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: "bold",
  },

  // Sections
  section: {
    marginBottom: 25,
  },

  sectionEyebrow: {
    color: C.orange,
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: "bold",
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: C.dark,
    marginBottom: 7,
  },

  sectionDescription: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.5,
    marginBottom: 17,
  },

  orangeLine: {
    width: 32,
    height: 3,
    backgroundColor: C.orange,
    marginBottom: 16,
  },

  // Ingredients
  category: {
    color: C.orange,
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 5,
    textTransform: "uppercase",
  },

  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 0.7,
    borderColor: "#F0EEEB",
  },

  ingredientName: {
    flex: 1,
    paddingRight: 12,
    color: C.text,
    fontSize: 9.5,
    lineHeight: 1.5,
  },

  ingredientAmount: {
    fontSize: 9,
    color: C.dark,
    fontWeight: "bold",
    textAlign: "right",
  },

  // Nutrition
  nutritionRow: {
    flexDirection: "row",
    marginTop: 5,
  },

  nutritionCard: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 9,
    marginRight: 7,
    backgroundColor: C.cream,
    borderRadius: 5,
  },

  nutritionValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: C.dark,
    marginBottom: 5,
  },

  nutritionLabel: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 0.7,
  },

  // Instructions
  step: {
    flexDirection: "row",
    marginBottom: 19,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.orange,
    color: C.white,
    textAlign: "center",
    paddingTop: 8,
    fontSize: 9,
    fontWeight: "bold",
    marginRight: 13,
  },

  stepBody: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.dark,
    marginBottom: 6,
  },

  stepText: {
    fontSize: 9.5,
    color: C.text,
    lineHeight: 1.65,
  },

  inlineTip: {
    marginTop: 8,
    backgroundColor: C.orangeLight,
    borderLeftWidth: 2,
    borderColor: C.orange,
    padding: 9,
  },

  inlineTipLabel: {
    color: C.orange,
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },

  inlineTipText: {
    color: C.text,
    fontSize: 8.5,
    lineHeight: 1.5,
  },

  // Tips
  tipRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 0.7,
    borderColor: C.border,
  },

  tipIndex: {
    color: C.orange,
    fontSize: 9,
    fontWeight: "bold",
    width: 34,
  },

  tipText: {
    flex: 1,
    fontSize: 9.5,
    color: C.text,
    lineHeight: 1.6,
  },

  // Substitutions
  substitution: {
    paddingVertical: 12,
    borderBottomWidth: 0.7,
    borderColor: C.border,
  },

  substitutionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: C.dark,
    marginBottom: 5,
  },

  substitutionText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: C.muted,
  },

  closing: {
    marginTop: 18,
    padding: 18,
    backgroundColor: C.orangeLight,
    borderRadius: 6,
  },

  closingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: C.dark,
    marginBottom: 6,
  },

  closingText: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.6,
  },
});

// These components must stay OUTSIDE RecipePDF.
function PDFHeader() {
  return (
    <View fixed style={styles.header}>
      <Image src="/essora_logo.png" style={styles.headerLogo} />
      <Text style={styles.headerText}>
        YOUR PERSONAL RECIPE COLLECTION
      </Text>
    </View>
  );
}

function PDFFooter() {
  return (
    <View fixed style={styles.footer}>
      <Text style={styles.footerBrand}>ESSORA</Text>

      <Text style={styles.footerText}>
        Made by Trivexa Labs · Naim
      </Text>

      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

function PDFWatermark() {
  return (
    <Text fixed style={styles.watermark}>
      TRIVEXA LABS · NAIM
    </Text>
  );
}

function PDFPageBranding() {
  return (
    <>
      <PDFHeader />
      <PDFWatermark />
      <PDFFooter />
    </>
  );
}

const safeText = (value, fallback = "") => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
};

const minutes = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const displayCategory = (value) =>
  safeText(value, "Other").replace(/[-_]/g, " ");

const formatNutrition = (value, unit) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const text = String(value).trim();

  // Avoid duplicated units, e.g. "32g g".
  if (/[a-z]/i.test(text)) {
    return text;
  }

  return `${text} ${unit}`;
};

export function RecipePDF({ recipe }) {
  if (!recipe) return null;

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : [];

  const tips = Array.isArray(recipe.tips) ? recipe.tips : [];

  const substitutions = Array.isArray(recipe.substitutions)
    ? recipe.substitutions
    : [];

  const prepTime = minutes(recipe.prepTime);
  const cookTime = minutes(recipe.cookTime);

  const groups = ingredients.reduce((result, item) => {
    const category = displayCategory(item.category);

    if (!result[category]) result[category] = [];
    result[category].push(item);

    return result;
  }, {});

  const nutrition = recipe.nutrition || {};

  const nutritionItems = [
    {
      label: "CALORIES",
      value: formatNutrition(nutrition.calories, "kcal"),
    },
    {
      label: "PROTEIN",
      value: formatNutrition(nutrition.protein, "g"),
    },
    {
      label: "CARBS",
      value: formatNutrition(nutrition.carbs, "g"),
    },
    {
      label: "FAT",
      value: formatNutrition(nutrition.fat, "g"),
    },
  ].filter((item) => item.value);

  const hasImage =
    typeof recipe.imageUrl === "string" &&
    recipe.imageUrl.trim().length > 0;

  return (
    <Document
      title={safeText(recipe.title, "Essora Recipe")}
      author="Trivexa Labs · Naim"
      subject="Essora Premium Recipe"
      creator="Essora"
    >
      {/* PAGE 1 — COVER */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.topBar}>
          <Image src="/essora_logo.png" style={styles.logo} />

          <Text style={styles.smallLabel}>
            THE ESSORA RECIPE COLLECTION
          </Text>
        </View>

        <Text style={styles.eyebrow}>
          {displayCategory(recipe.category).toUpperCase()} RECIPE
        </Text>

        <Text style={styles.coverTitle}>
          {safeText(recipe.title, "Untitled Recipe")}
        </Text>

        {recipe.description ? (
          <Text style={styles.description}>
            {recipe.description}
          </Text>
        ) : null}

        {hasImage ? (
          <Image src={recipe.imageUrl} style={styles.hero} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackText}>
              ESSORA · MADE WITH CARE
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={[styles.metaItem, styles.metaFirst]}>
            <Text style={styles.metaLabel}>PREPARATION</Text>
            <Text style={styles.metaValue}>{prepTime} min</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>COOKING</Text>
            <Text style={styles.metaValue}>{cookTime} min</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TOTAL TIME</Text>
            <Text style={styles.metaValue}>
              {prepTime + cookTime} min
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>SERVINGS</Text>
            <Text style={styles.metaValue}>
              {safeText(recipe.servings, "—")}
            </Text>
          </View>
        </View>

        <View style={styles.tags}>
          {recipe.cuisine ? (
            <Text style={styles.tag}>
              {displayCategory(recipe.cuisine)}
            </Text>
          ) : null}

          {recipe.category ? (
            <Text style={styles.tag}>
              {displayCategory(recipe.category)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.coverClosing}>
          COOK SOMETHING WONDERFUL.
        </Text>

        <PDFFooter />
      </Page>

      {/* PAGE 2 — INGREDIENTS AND NUTRITION */}
      <Page size="A4" style={styles.page} wrap>
        <PDFPageBranding />

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            01 / PREPARE
          </Text>

          <Text style={styles.sectionTitle}>
            Ingredients
          </Text>

          <View style={styles.orangeLine} />

          <Text style={styles.sectionDescription}>
            Everything you need to prepare this recipe.
          </Text>

          {Object.entries(groups).map(([category, items]) => (
            <View key={category}>
              <Text style={styles.category}>
                {category}
              </Text>

              {items.map((item, index) => (
                <View
                  key={`${category}-${index}`}
                  style={styles.ingredientRow}
                  wrap={false}
                >
                  <Text style={styles.ingredientName}>
                    {safeText(item.item)}
                  </Text>

                  <Text style={styles.ingredientAmount}>
                    {safeText(item.amount, "As needed")}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {nutritionItems.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionEyebrow}>
              02 / NOURISH
            </Text>

            <Text style={styles.sectionTitle}>
              Nutrition per serving
            </Text>

            <View style={styles.orangeLine} />

            <View style={styles.nutritionRow}>
              {nutritionItems.map((item) => (
                <View
                  key={item.label}
                  style={styles.nutritionCard}
                >
                  <Text style={styles.nutritionValue}>
                    {item.value}
                  </Text>

                  <Text style={styles.nutritionLabel}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Page>

      {/* PAGE 3 — COOKING INSTRUCTIONS */}
      <Page size="A4" style={styles.page} wrap>
        <PDFPageBranding />

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            03 / THE METHOD
          </Text>

          <Text style={styles.sectionTitle}>
            Step-by-Step Instructions
          </Text>

          <View style={styles.orangeLine} />

          <Text style={styles.sectionDescription}>
            Take your time, follow each step, and enjoy the process.
          </Text>

          {instructions.map((step, index) => (
            <View
              key={step.step ?? index}
              style={styles.step}
              wrap={false}
            >
              <Text style={styles.stepNumber}>
                {step.step ?? index + 1}
              </Text>

              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>
                  {safeText(step.title, `Step ${index + 1}`)}
                </Text>

                <Text style={styles.stepText}>
                  {safeText(step.instruction)}
                </Text>

                {step.tip ? (
                  <View style={styles.inlineTip}>
                    <Text style={styles.inlineTipLabel}>
                      CHEF'S TIP
                    </Text>

                    <Text style={styles.inlineTipText}>
                      {step.tip}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </Page>

      {/* PAGE 4 — TIPS AND SUBSTITUTIONS */}
      {(tips.length > 0 || substitutions.length > 0) && (
        <Page size="A4" style={styles.page} wrap>
          <PDFPageBranding />

          {tips.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>
                04 / PERFECT IT
              </Text>

              <Text style={styles.sectionTitle}>
                Chef's Tips & Tricks
              </Text>

              <View style={styles.orangeLine} />

              {tips.map((tip, index) => (
                <View
                  key={index}
                  style={styles.tipRow}
                  wrap={false}
                >
                  <Text style={styles.tipIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>

                  <Text style={styles.tipText}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {substitutions.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>
                05 / MAKE IT YOURS
              </Text>

              <Text style={styles.sectionTitle}>
                Ingredient Substitutions
              </Text>

              <View style={styles.orangeLine} />

              {substitutions.map((sub, index) => (
                <View
                  key={index}
                  style={styles.substitution}
                  wrap={false}
                >
                  <Text style={styles.substitutionTitle}>
                    Instead of {safeText(sub.original)}
                  </Text>

                  <Text style={styles.substitutionText}>
                    Try:{" "}
                    {Array.isArray(sub.alternatives)
                      ? sub.alternatives.join(", ")
                      : safeText(sub.alternatives)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.closing} wrap={false}>
            <Text style={styles.closingTitle}>
              Made to be enjoyed.
            </Text>

            <Text style={styles.closingText}>
              Thank you for cooking with Essora.
              Discover something delicious every day.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
