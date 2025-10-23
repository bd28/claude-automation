#!/usr/bin/env node

/**
 * Upload screenshots to Supabase Storage for GitHub issue comments
 *
 * Usage:
 *   npm run upload-screenshots -- --issue=268 --files=".playwright-mcp/*.png"
 *   npm run upload-screenshots -- --issue=268 --files="screenshot1.png,screenshot2.png"
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { glob } from 'glob';

const BUCKET_NAME = 'github-assets';

// Parse command line arguments
const args = process.argv.slice(2);
const issueArg = args.find((arg) => arg.startsWith('--issue='));
const filesArg = args.find((arg) => arg.startsWith('--files='));

if (!issueArg || !filesArg) {
  console.error(
    'Usage: npm run upload-screenshots -- --issue=<number> --files="<pattern>"'
  );
  console.error(
    'Example: npm run upload-screenshots -- --issue=268 --files=".playwright-mcp/*.png"'
  );
  process.exit(1);
}

const issueNumber = issueArg.split('=')[1];
const filesPattern = filesArg.split('=')[1];

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadScreenshots() {
  // Resolve file pattern to actual files
  const files = filesPattern.includes('*')
    ? await glob(filesPattern)
    : filesPattern.split(',').map((f) => f.trim());

  if (files.length === 0) {
    console.error('No files found matching pattern:', filesPattern);
    process.exit(1);
  }

  console.log(
    `Found ${files.length} file(s) to upload for issue #${issueNumber}`
  );

  const uploadedUrls = [];

  for (const filePath of files) {
    const fileName = basename(filePath);
    const storageFileName = `issue-${issueNumber}-${fileName}`;

    try {
      // Read file as buffer
      const fileBuffer = readFileSync(filePath);

      // Determine content type
      const contentType = fileName.endsWith('.png')
        ? 'image/png'
        : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
          ? 'image/jpeg'
          : fileName.endsWith('.gif')
            ? 'image/gif'
            : fileName.endsWith('.webp')
              ? 'image/webp'
              : 'image/png';

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storageFileName, fileBuffer, {
          contentType,
          upsert: true, // Overwrite if exists
        });

      if (error) {
        console.error(`Error uploading ${fileName}:`, error.message);
        continue;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storageFileName);

      uploadedUrls.push({
        fileName,
        storageFileName,
        publicUrl,
      });

      console.log(`✓ Uploaded: ${fileName} -> ${publicUrl}`);
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log(
    `Successfully uploaded ${uploadedUrls.length}/${files.length} file(s)`
  );
  console.log('='.repeat(80));

  if (uploadedUrls.length > 0) {
    console.log('\nMarkdown for GitHub issue comment:\n');
    uploadedUrls.forEach(({ fileName, publicUrl }) => {
      console.log(`![${fileName}](${publicUrl})`);
    });
  }

  return uploadedUrls;
}

uploadScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
