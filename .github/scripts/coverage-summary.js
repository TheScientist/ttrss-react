// Append coverage summary to GitHub Actions job summary without external services
// Expects Vitest (v8 provider) to have generated coverage/coverage-summary.json

const fs = require('fs');
const path = require('path');

function main() {
  const summaryFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryFile)) {
    console.log('No coverage-summary.json found, skipping summary.');
    process.exit(0);
  }
  const data = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  const total = data.total || {};
  const lines = total.lines || {}; // { total, covered, pct }
  const functions = total.functions || {};
  const branches = total.branches || {};
  const statements = total.statements || {};

  const md = [
    '# Test Coverage Summary',
    '',
    `- Lines: ${lines.pct ?? 0}% (${lines.covered ?? 0}/${lines.total ?? 0})`,
    `- Functions: ${functions.pct ?? 0}% (${functions.covered ?? 0}/${functions.total ?? 0})`,
    `- Branches: ${branches.pct ?? 0}% (${branches.covered ?? 0}/${branches.total ?? 0})`,
    `- Statements: ${statements.pct ?? 0}% (${statements.covered ?? 0}/${statements.total ?? 0})`,
    '',
    'Artifact contains full HTML report in coverage/index.html.',
  ].join('\n');

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.appendFileSync(summaryPath, md + '\n');
    console.log('Appended coverage summary to GitHub job summary.');
  } else {
    console.log(md);
  }
}

main();
