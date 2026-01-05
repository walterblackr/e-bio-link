// Script para convertir propuesta.tsx de styled-jsx a CSS Module
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', '(marketing)', 'propuesta', 'page.tsx');

// Leer archivo
let content = fs.readFileSync(filePath, 'utf8');

// 1. Agregar import del CSS Module
content = content.replace(
  `import { Clock, ArrowRight, TrendingDown, AlertCircle, CreditCard, Calendar, CheckCircle, Star } from 'lucide-react';`,
  `import { Clock, ArrowRight, TrendingDown, AlertCircle, CreditCard, Calendar, CheckCircle, Star } from 'lucide-react';\nimport styles from './propuesta.module.css';`
);

// 2. Eliminar bloque <style jsx global>
content = content.replace(
  /\s*<style jsx global>\{`[\s\S]*?`\}<\/style>\s*/,
  ''
);

// 3. Mapeo de nombres de clases CSS a camelCase para CSS Modules
const classMap = {
  'propuesta-container': 'propuestaContainer',
  'hero-section': 'heroSection',
  'hero-content': 'heroContent',
  'hero-badge': 'heroBadge',
  'hero-title': 'heroTitle',
  'hero-title-highlight': 'heroTitleHighlight',
  'hero-subtitle': 'heroSubtitle',
  'hero-bg': 'heroBg',
  'hero-bg-blob': 'heroBgBlob',
  'content-container': 'contentContainer',
  'section-card': 'sectionCard',
  'section-border-blue': 'sectionBorderBlue',
  'section-border-red': 'sectionBorderRed',
  'section-header': 'sectionHeader',
  'icon-box': 'iconBox',
  'icon-box-blue': 'iconBoxBlue',
  'icon-box-red': 'iconBoxRed',
  'section-title': 'sectionTitle',
  'section-subtitle': 'sectionSubtitle',
  'section-text': 'sectionText',
  'time-math': 'timeMath',
  'time-math-result': 'timeMathResult',
  'solution-box': 'solutionBox',
  'solution-title': 'solutionTitle',
  'solution-text': 'solutionText',
  'solution-number': 'solutionNumber',
  'impact-calc': 'impactCalc',
  'impact-row': 'impactRow',
  'impact-row-main': 'impactRowMain',
  'impact-label': 'impactLabel',
  'impact-label-strong': 'impactLabelStrong',
  'impact-value-striked': 'impactValueStriked',
  'impact-value-red': 'impactValueRed',
  'impact-divider': 'impactDivider',
  'impact-total-label': 'impactTotalLabel',
  'impact-total-value': 'impactTotalValue',
  'analysis-box': 'analysisBox',
  'analysis-header': 'analysisHeader',
  'analysis-title': 'analysisTitle',
  'analysis-text': 'analysisText',
  'plans-section': 'plansSection',
  'plans-title': 'plansTitle',
  'plans-grid': 'plansGrid',
  'plan-card': 'planCard',
  'plan-card-recommended': 'planCardRecommended',
  'plan-badge': 'planBadge',
  'plan-title': 'planTitle',
  'plan-description': 'planDescription',
  'plan-price-container': 'planPriceContainer',
  'plan-price': 'planPrice',
  'plan-price-normal': 'planPriceNormal',
  'plan-price-label': 'planPriceLabel',
  'plan-details': 'planDetails',
  'plan-details-normal': 'planDetailsNormal',
  'plan-detail-row': 'planDetailRow',
  'plan-detail-label': 'planDetailLabel',
  'plan-detail-value': 'planDetailValue',
  'plan-detail-value-normal': 'planDetailValueNormal',
  'plan-detail-value-strong': 'planDetailValueStrong',
  'plan-button': 'planButton',
  'plan-button-primary': 'planButtonPrimary',
  'plan-button-secondary': 'planButtonSecondary',
  'features-section': 'featuresSection',
  'features-bg': 'featuresBg',
  'features-title': 'featuresTitle',
  'features-grid': 'featuresGrid',
  'feature-item': 'featureItem',
  'feature-icon': 'featureIcon',
  'feature-icon-blue': 'featureIconBlue',
  'feature-icon-purple': 'featureIconPurple',
  'feature-icon-green': 'featureIconGreen',
  'feature-icon-orange': 'featureIconOrange',
  'feature-title': 'featureTitle',
  'feature-description': 'featureDescription',
  'footer': 'footer',
  'section-flex': 'sectionFlex',
  'section-flex-2-3': 'sectionFlex23',
  'section-flex-1-3': 'sectionFlex13'
};

// 4. Reemplazar className="..." con className={styles....}
// Para clases únicas
Object.entries(classMap).forEach(([oldClass, newClass]) => {
  // className="old-class"
  const singleRegex = new RegExp(`className="${oldClass}"`, 'g');
  content = content.replace(singleRegex, `className={styles.${newClass}}`);
});

// Para clases múltiples, reemplazar manualmente las más comunes
content = content.replace(
  /className="plan-card plan-card-recommended"/g,
  `className={\`\${styles.planCard} \${styles.planCardRecommended}\`}`
);

content = content.replace(
  /className="icon-box icon-box-blue"/g,
  `className={\`\${styles.iconBox} \${styles.iconBoxBlue}\`}`
);

content = content.replace(
  /className="icon-box icon-box-red"/g,
  `className={\`\${styles.iconBox} \${styles.iconBoxRed}\`}`
);

// 5. Cambiar <> por <div className={styles.propuestaContainer}>
content = content.replace(
  /return \(\s*<>\s*/,
  `return (\n    <div className={styles.propuestaContainer}>`
);

content = content.replace(
  /<\/>\s*\);/,
  `</div>\n  );`
);

// 6. Eliminar el div interno .propuesta-container que ahora es redundante
content = content.replace(
  /<div className=\{styles\.propuestaContainer\}>\s*<div className=\{styles\.propuestaContainer\}>/,
  `<div className={styles.propuestaContainer}>`
);

// Guardar archivo
fs.writeFileSync(filePath, content, 'utf8');

