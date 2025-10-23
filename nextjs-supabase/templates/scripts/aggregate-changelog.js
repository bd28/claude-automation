#!/usr/bin/env node

/**
 * Aggregate changelog fragments into CHANGELOG.md
 *
 * Usage:
 *   npm run changelog:preview         # Dry-run (no changes)
 *   npm run release                   # Aggregate and proceed with release
 *   node scripts/aggregate-changelog.js
 *   node scripts/aggregate-changelog.js --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGESET_DIR = path.join(__dirname, '..', '.changeset');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

// Change type order (for sorting in changelog)
const TYPE_ORDER = {
  added: 1,
  changed: 2,
  deprecated: 3,
  removed: 4,
  fixed: 5,
  security: 6,
};

// Change type headers (for Keep a Changelog format)
const TYPE_HEADERS = {
  added: 'Added',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
  security: 'Security',
};

/**
 * Parse YAML frontmatter from a fragment file
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(
    /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  );

  if (!frontmatterMatch) {
    throw new Error('Invalid fragment format: missing frontmatter');
  }

  const [, frontmatter, body] = frontmatterMatch;
  const metadata = {};

  // Parse YAML-like frontmatter (simple key: value pairs)
  frontmatter.split('\n').forEach((line) => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes from string values
      metadata[key] = value.replace(/^["']|["']$/g, '').trim();
    }
  });

  return {
    type: metadata.type,
    issue: parseInt(metadata.issue, 10),
    title: metadata.title,
    body: body.trim(),
  };
}

/**
 * Read and parse all fragment files
 */
function readFragments() {
  if (!fs.existsSync(CHANGESET_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CHANGESET_DIR);
  const fragments = [];

  for (const file of files) {
    // Skip non-markdown files and special files
    if (!file.endsWith('.md') || file.startsWith('_') || file === 'README.md') {
      continue;
    }

    const filePath = path.join(CHANGESET_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const fragment = parseFrontmatter(content);
      fragment.filename = file;
      fragments.push(fragment);
    } catch (error) {
      console.error(`⚠️  Warning: Failed to parse ${file}: ${error.message}`);
    }
  }

  return fragments;
}

/**
 * Group fragments by change type
 */
function groupFragmentsByType(fragments) {
  const groups = {};

  for (const fragment of fragments) {
    const type = fragment.type || 'changed';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(fragment);
  }

  // Sort fragments within each group by issue number
  for (const type in groups) {
    groups[type].sort((a, b) => a.issue - b.issue);
  }

  return groups;
}

/**
 * Generate changelog section from grouped fragments
 */
function generateChangelogSection(groups) {
  const lines = [];

  // Sort groups by type order
  const sortedTypes = Object.keys(groups).sort(
    (a, b) => (TYPE_ORDER[a] || 999) - (TYPE_ORDER[b] || 999)
  );

  for (const type of sortedTypes) {
    const fragments = groups[type];
    const header =
      TYPE_HEADERS[type] || type.charAt(0).toUpperCase() + type.slice(1);

    lines.push(`### ${header}\n`);

    for (const fragment of fragments) {
      // Format: - **Title** (#issue)
      lines.push(`- **${fragment.title}** (#${fragment.issue})`);

      // Add body lines (already formatted as bullet points)
      const bodyLines = fragment.body.split('\n').filter((line) => line.trim());
      for (const line of bodyLines) {
        lines.push(`  ${line}`);
      }

      lines.push(''); // Empty line between entries
    }
  }

  return lines.join('\n');
}

/**
 * Insert new section into CHANGELOG.md under [Unreleased]
 */
function updateChangelog(newSection, dryRun = false) {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    throw new Error('CHANGELOG.md not found');
  }

  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

  // Find the [Unreleased] section
  const unreleasedMatch = changelog.match(/## \[Unreleased\]\s*\n/);
  if (!unreleasedMatch) {
    throw new Error('[Unreleased] section not found in CHANGELOG.md');
  }

  const insertPosition = unreleasedMatch.index + unreleasedMatch[0].length;

  // Check if [Unreleased] section already has content
  const afterUnreleased = changelog.slice(insertPosition);
  const nextSectionMatch = afterUnreleased.match(/\n## \[/);
  const unreleasedContent = nextSectionMatch
    ? afterUnreleased.slice(0, nextSectionMatch.index).trim()
    : afterUnreleased.trim();

  if (unreleasedContent && !dryRun) {
    console.warn('\n⚠️  Warning: [Unreleased] section already has content!');
    console.warn('The aggregated fragments will be prepended.\n');
  }

  // Insert new section after [Unreleased] header
  const updatedChangelog =
    changelog.slice(0, insertPosition) +
    '\n' +
    newSection +
    '\n' +
    changelog.slice(insertPosition);

  if (dryRun) {
    console.log('\n📋 Preview of aggregated changelog:\n');
    console.log('─'.repeat(80));
    console.log(newSection);
    console.log('─'.repeat(80));
    console.log('\n(No changes made - dry-run mode)\n');
  } else {
    fs.writeFileSync(CHANGELOG_PATH, updatedChangelog, 'utf8');
    console.log('✅ CHANGELOG.md updated successfully');
  }
}

/**
 * Delete processed fragment files
 */
function deleteFragments(fragments, dryRun = false) {
  if (dryRun) {
    console.log(`\n📁 Would delete ${fragments.length} fragment file(s):`);
    fragments.forEach((f) => console.log(`   - ${f.filename}`));
    return;
  }

  let deleted = 0;
  for (const fragment of fragments) {
    const filePath = path.join(CHANGESET_DIR, fragment.filename);
    try {
      fs.unlinkSync(filePath);
      deleted++;
    } catch (error) {
      console.error(
        `⚠️  Failed to delete ${fragment.filename}: ${error.message}`
      );
    }
  }

  console.log(`🗑️  Deleted ${deleted} fragment file(s)`);
}

/**
 * Main aggregation workflow
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    console.log('\n📦 Aggregating changelog fragments...\n');

    // Read all fragments
    const fragments = readFragments();

    if (fragments.length === 0) {
      console.log('ℹ️  No changelog fragments found in .changeset/');
      console.log('   Use "npm run changelog:add" to create a fragment.\n');
      return;
    }

    console.log(`Found ${fragments.length} fragment(s):`);
    fragments.forEach((f) => {
      console.log(`  - ${f.filename}: [${f.type}] ${f.title} (#${f.issue})`);
    });
    console.log('');

    // Group by type
    const groups = groupFragmentsByType(fragments);

    // Generate changelog section
    const newSection = generateChangelogSection(groups);

    // Update CHANGELOG.md
    updateChangelog(newSection, dryRun);

    // Delete processed fragments
    deleteFragments(fragments, dryRun);

    if (!dryRun) {
      console.log('\n✨ Aggregation complete!\n');
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for testing
export { parseFrontmatter, groupFragmentsByType, generateChangelogSection };
