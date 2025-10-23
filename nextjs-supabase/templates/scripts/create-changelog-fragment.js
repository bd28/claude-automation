#!/usr/bin/env node

/**
 * Create a changelog fragment interactively
 *
 * Usage:
 *   npm run changelog:add
 *   node scripts/create-changelog-fragment.js
 *   node scripts/create-changelog-fragment.js --issue=280 --type=added
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGESET_DIR = path.join(__dirname, '..', '.changeset');

const CHANGE_TYPES = [
  { value: 'added', description: 'New features or functionality' },
  { value: 'fixed', description: 'Bug fixes and corrections' },
  { value: 'changed', description: 'Changes to existing functionality' },
  { value: 'deprecated', description: 'Features marked for future removal' },
  { value: 'removed', description: 'Removed features or functionality' },
  { value: 'security', description: 'Security patches or vulnerability fixes' },
];

// Parse command-line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const match = arg.match(/--([^=]+)=(.+)/);
    if (match) {
      args[match[1]] = match[2];
    }
  });
  return args;
}

// Create readline interface
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Prompt user for input
function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Validate issue number
function validateIssueNumber(input) {
  const num = parseInt(input, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error('Issue number must be a positive integer');
  }
  return num;
}

// Validate change type
function validateChangeType(input) {
  const type = input.toLowerCase().trim();
  const validTypes = CHANGE_TYPES.map((t) => t.value);
  if (!validTypes.includes(type)) {
    throw new Error(
      `Invalid change type. Must be one of: ${validTypes.join(', ')}`
    );
  }
  return type;
}

// Display change types menu
function displayChangeTypes() {
  console.log('\nAvailable change types:');
  CHANGE_TYPES.forEach((type, index) => {
    console.log(
      `  ${index + 1}. ${type.value.padEnd(12)} - ${type.description}`
    );
  });
  console.log('');
}

// Main interactive workflow
async function interactive() {
  const rl = createInterface();

  try {
    console.log('\n📝 Creating a changelog fragment\n');

    // Get issue number
    const issueInput = await question(rl, 'Issue or PR number: ');
    const issueNumber = validateIssueNumber(issueInput);

    // Check if fragment already exists
    const fragmentPath = path.join(CHANGESET_DIR, `${issueNumber}.md`);
    if (fs.existsSync(fragmentPath)) {
      const overwrite = await question(
        rl,
        `\n⚠️  Fragment for issue #${issueNumber} already exists. Overwrite? (y/N): `
      );
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        rl.close();
        return;
      }
    }

    // Get change type
    displayChangeTypes();
    const typeInput = await question(rl, 'Change type (number or name): ');

    let changeType;
    const typeIndex = parseInt(typeInput, 10);
    if (
      !isNaN(typeIndex) &&
      typeIndex >= 1 &&
      typeIndex <= CHANGE_TYPES.length
    ) {
      changeType = CHANGE_TYPES[typeIndex - 1].value;
    } else {
      changeType = validateChangeType(typeInput);
    }

    // Get PR number (optional)
    const prInput = await question(
      rl,
      '\nPR number (optional, press Enter to skip): '
    );
    const prNumber = prInput.trim() ? parseInt(prInput, 10) : 0;
    if (prInput.trim() && (isNaN(prNumber) || prNumber <= 0)) {
      throw new Error('PR number must be a positive integer');
    }

    // Get title
    const title = await question(rl, '\nBrief title: ');
    if (!title.trim()) {
      throw new Error('Title cannot be empty');
    }

    // Get description (multi-line)
    console.log('\nDescription (bullet points, one per line):');
    console.log('(Press Ctrl+D or type "done" on a new line when finished)\n');

    const descriptionLines = [];
    let line;
    while (true) {
      line = await question(rl, '- ');
      if (!line || line.trim().toLowerCase() === 'done') {
        break;
      }
      descriptionLines.push(line.trim());
    }

    if (descriptionLines.length === 0) {
      throw new Error('Description cannot be empty');
    }

    // Generate fragment content
    const fragmentContent = generateFragmentContent(
      changeType,
      issueNumber,
      prNumber,
      title.trim(),
      descriptionLines
    );

    // Write fragment file
    fs.writeFileSync(fragmentPath, fragmentContent, 'utf8');

    console.log(`\n✅ Fragment created: .changeset/${issueNumber}.md`);
    console.log('\nNext steps:');
    console.log('  1. Review the fragment file');
    console.log('  2. Commit it with your changes');
    console.log('  3. Create a pull request\n');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Non-interactive workflow (from CLI args)
function nonInteractive(args) {
  try {
    if (!args.issue || !args.type) {
      throw new Error(
        'Both --issue and --type are required for non-interactive mode'
      );
    }

    const issueNumber = validateIssueNumber(args.issue);
    const changeType = validateChangeType(args.type);
    const title = args.title || 'Change description';
    const description = args.description
      ? args.description.split('\\n')
      : ['Brief description of the change'];

    const prNumber = args.pr ? parseInt(args.pr, 10) : 0;
    const fragmentPath = path.join(CHANGESET_DIR, `${issueNumber}.md`);
    const fragmentContent = generateFragmentContent(
      changeType,
      issueNumber,
      prNumber,
      title,
      description
    );

    fs.writeFileSync(fragmentPath, fragmentContent, 'utf8');
    console.log(`Fragment created: .changeset/${issueNumber}.md`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Generate fragment file content
function generateFragmentContent(type, issue, pr, title, descriptionLines) {
  const description = descriptionLines.map((line) => `- ${line}`).join('\n');

  return `---
type: ${type}
issue: ${issue}
pr: ${pr}
title: "${title}"
---

${description}
`;
}

// Main entry point
function main() {
  // Ensure .changeset directory exists
  if (!fs.existsSync(CHANGESET_DIR)) {
    fs.mkdirSync(CHANGESET_DIR, { recursive: true });
  }

  const args = parseArgs();

  if (args.issue && args.type) {
    // Non-interactive mode
    nonInteractive(args);
  } else {
    // Interactive mode
    interactive();
  }
}

main();
