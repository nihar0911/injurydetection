const fs = require('fs');
let content = fs.readFileSync('src/pages/Triage.tsx', 'utf8');

content = content.replace("import UpgradeModal from '../components/UpgradeModal';\r\n", "");
content = content.replace("import UpgradeModal from '../components/UpgradeModal';\n", "");

content = content.replace("  const [showUpgrade, setShowUpgrade] = useState(false);\r\n", "");
content = content.replace("  const [showUpgrade, setShowUpgrade] = useState(false);\n", "");

content = content.replace(/  const checkGating[\s\S]*?return true;\r?\n  };\r?\n\r?\n/, "");
content = content.replace("onClick={() => checkGating() && setStep('vitals')}", "onClick={() => setStep('vitals')}");

content = content.replace(/const tierAllowedSteps = profile\?\.tier === 'pro'[\s\S]*?matchedCondition\.recoverySteps\.slice\(0, 7\);/, "const tierAllowedSteps = matchedCondition.recoverySteps;");

content = content.replace(/          if \(profile\?\.tier === 'free'\) {[\s\S]*?await refreshProfile\(\);\r?\n          }\r?\n/, "");

content = content.replace(/<UpgradeModal[\s\S]*?\/>\r?\n/, "");

fs.writeFileSync('src/pages/Triage.tsx', content);
console.log('done');
