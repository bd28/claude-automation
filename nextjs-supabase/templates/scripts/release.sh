#!/bin/bash

# Release automation script for changelog-driven releases
# Updates CHANGELOG.md, creates git tag, and optionally creates GitHub release
#
# Usage:
#   Interactive:  npm run release
#   Automated:    RELEASE_TYPE=minor SKIP_PROMPTS=true npm run release
#
# Environment variables:
#   SKIP_PROMPTS=true              Skip all interactive prompts
#   RELEASE_TYPE=major|minor|patch Version bump type
#   CUSTOM_VERSION=X.Y.Z           Custom version (overrides RELEASE_TYPE)
#   CREATE_GITHUB_RELEASE=true     Create GitHub release (default: true)
#   FORCE_RELEASE=true             Skip empty changelog check

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment variables
SKIP_PROMPTS=${SKIP_PROMPTS:-false}
RELEASE_TYPE=${RELEASE_TYPE:-}
CUSTOM_VERSION=${CUSTOM_VERSION:-}
CREATE_GITHUB_RELEASE=${CREATE_GITHUB_RELEASE:-true}
FORCE_RELEASE=${FORCE_RELEASE:-false}

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
REPO_URL=$(git config --get remote.origin.url | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Release Automation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Current version: ${GREEN}${CURRENT_VERSION}${NC}"
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    git status -s
    exit 1
fi

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    if [[ "$SKIP_PROMPTS" == "true" ]]; then
        echo -e "${RED}Error: Not on main branch (current: ${CURRENT_BRANCH})${NC}"
        exit 1
    else
        echo -e "${YELLOW}Warning: You are not on the main branch (current: ${CURRENT_BRANCH})${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Pull latest changes
echo -e "${BLUE}Pulling latest changes...${NC}"
git pull origin main

# Get new version
if [[ -n "$CUSTOM_VERSION" ]]; then
    # Custom version provided via environment variable
    NEW_VERSION="$CUSTOM_VERSION"
    echo ""
    echo -e "${GREEN}Using custom version: ${NEW_VERSION}${NC}"
elif [[ "$SKIP_PROMPTS" == "true" ]]; then
    # Non-interactive mode: use RELEASE_TYPE
    if [[ -z "$RELEASE_TYPE" ]]; then
        echo -e "${RED}Error: RELEASE_TYPE environment variable required in non-interactive mode${NC}"
        echo -e "${RED}Set RELEASE_TYPE to: major, minor, or patch${NC}"
        exit 1
    fi

    case $RELEASE_TYPE in
        major)
            IFS='.' read -ra VER <<< "$CURRENT_VERSION"
            NEW_VERSION="$((VER[0] + 1)).0.0"
            ;;
        minor)
            IFS='.' read -ra VER <<< "$CURRENT_VERSION"
            NEW_VERSION="${VER[0]}.$((VER[1] + 1)).0"
            ;;
        patch)
            IFS='.' read -ra VER <<< "$CURRENT_VERSION"
            NEW_VERSION="${VER[0]}.${VER[1]}.$((VER[2] + 1))"
            ;;
        *)
            echo -e "${RED}Error: Invalid RELEASE_TYPE '${RELEASE_TYPE}'${NC}"
            echo -e "${RED}Must be: major, minor, or patch${NC}"
            exit 1
            ;;
    esac
    echo ""
    echo -e "${GREEN}Release type: ${RELEASE_TYPE} (${CURRENT_VERSION} → ${NEW_VERSION})${NC}"
else
    # Interactive mode
    echo ""
    echo "What type of release is this?"
    echo "  1) Major (breaking changes) - ${CURRENT_VERSION} → X.0.0"
    echo "  2) Minor (new features)      - ${CURRENT_VERSION} → 0.X.0"
    echo "  3) Patch (bug fixes)         - ${CURRENT_VERSION} → 0.0.X"
    echo "  4) Custom version"
    echo ""
    read -p "Enter choice (1-4): " VERSION_CHOICE

    case $VERSION_CHOICE in
        1)
            IFS='.' read -ra VER <<< "$CURRENT_VERSION"
            NEW_VERSION="$((VER[0] + 1)).0.0"
            ;;
        2)
            IFS='.' read -ra VER <<< "$CURRENT_VERSION"
            NEW_VERSION="${VER[0]}.$((VER[1] + 1)).0"
            ;;
        3)
            IFS='.' read -ra VER <<< "$CURRENT_VERSION"
            NEW_VERSION="${VER[0]}.${VER[1]}.$((VER[2] + 1))"
            ;;
        4)
            read -p "Enter custom version (e.g., 1.2.3): " NEW_VERSION
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
fi

echo ""
echo -e "${GREEN}Releasing version: ${NEW_VERSION}${NC}"
echo ""

# Get today's date in YYYY-MM-DD format
TODAY=$(date +%Y-%m-%d)

# Check if [Unreleased] section has content
if ! grep -A 5 "## \[Unreleased\]" CHANGELOG.md | grep -q "###"; then
    if [[ "$FORCE_RELEASE" == "true" ]]; then
        echo -e "${YELLOW}Warning: [Unreleased] section appears empty (continuing due to FORCE_RELEASE)${NC}"
    elif [[ "$SKIP_PROMPTS" == "true" ]]; then
        echo -e "${RED}Error: [Unreleased] section appears empty${NC}"
        echo -e "${RED}Set FORCE_RELEASE=true to bypass this check${NC}"
        exit 1
    else
        echo -e "${YELLOW}Warning: [Unreleased] section appears empty${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Show what will be released
echo -e "${BLUE}Changes to be released:${NC}"
echo ""
sed -n '/## \[Unreleased\]/,/## \[/p' CHANGELOG.md | sed '$d'
echo ""

if [[ "$SKIP_PROMPTS" != "true" ]]; then
    read -p "Proceed with release? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Updating Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update package.json version
echo -e "${BLUE}1. Updating package.json...${NC}"
npm version $NEW_VERSION --no-git-tag-version

# Update CHANGELOG.md
echo -e "${BLUE}2. Updating CHANGELOG.md...${NC}"

# Create a temporary file
TEMP_FILE=$(mktemp)

# Process CHANGELOG.md
awk -v version="$NEW_VERSION" -v date="$TODAY" -v prev_version="$CURRENT_VERSION" '
BEGIN { unreleased_done = 0; in_unreleased = 0 }

# Match [Unreleased] header
/^## \[Unreleased\]/ {
    print "## [Unreleased]"
    print ""
    in_unreleased = 1
    next
}

# When we hit the next version section after Unreleased
/^## \[/ && in_unreleased {
    # Insert the new version section
    print "## [" version "] - " date
    print ""
    print unreleased_content
    in_unreleased = 0
    unreleased_done = 1
}

# Collect unreleased content
in_unreleased && !/^## \[Unreleased\]/ {
    unreleased_content = unreleased_content $0 "\n"
    next
}

# Update version links at the bottom
/^\[Unreleased\]:/ {
    print "[Unreleased]: " ENVIRON["REPO_URL"] "/compare/v" version "...HEAD"
    next
}

# If this is the first version link, insert the new version link before it
/^\[/ && !version_link_added {
    print "[" version "]: " ENVIRON["REPO_URL"] "/compare/v" prev_version "...v" version
    version_link_added = 1
}

# Print all other lines
{ print }
' REPO_URL="$REPO_URL" CHANGELOG.md > "$TEMP_FILE"

# Replace CHANGELOG.md
mv "$TEMP_FILE" CHANGELOG.md

echo -e "${GREEN}✓ Updated CHANGELOG.md${NC}"
echo -e "${GREEN}✓ Updated package.json${NC}"

# Commit changes
echo ""
echo -e "${BLUE}3. Creating git commit...${NC}"
git add CHANGELOG.md package.json package-lock.json 2>/dev/null || git add CHANGELOG.md package.json
git commit -m "chore: Release v${NEW_VERSION}

Updated CHANGELOG.md and package.json for release.

Release notes: ${REPO_URL}/releases/tag/v${NEW_VERSION}"

echo -e "${GREEN}✓ Created commit${NC}"

# Create git tag
echo ""
echo -e "${BLUE}4. Creating git tag v${NEW_VERSION}...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}

$(sed -n "/## \[${NEW_VERSION}\]/,/## \[/p" CHANGELOG.md | sed '$d')"

echo -e "${GREEN}✓ Created tag v${NEW_VERSION}${NC}"

# Push to GitHub
echo ""
echo -e "${BLUE}5. Pushing to GitHub...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"

echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# Create GitHub release
SHOULD_CREATE_RELEASE="false"

if [[ "$SKIP_PROMPTS" == "true" ]]; then
    # Non-interactive: use environment variable
    if [[ "$CREATE_GITHUB_RELEASE" == "true" ]]; then
        SHOULD_CREATE_RELEASE="true"
        echo ""
        echo -e "${BLUE}Creating GitHub release (CREATE_GITHUB_RELEASE=true)${NC}"
    else
        echo ""
        echo -e "${YELLOW}Skipping GitHub release (CREATE_GITHUB_RELEASE=false)${NC}"
    fi
else
    # Interactive: prompt user
    echo ""
    read -p "Create GitHub release? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        SHOULD_CREATE_RELEASE="true"
    fi
fi

if [[ "$SHOULD_CREATE_RELEASE" == "true" ]]; then
    echo -e "${BLUE}6. Creating GitHub release...${NC}"

    # Extract release notes from CHANGELOG.md
    RELEASE_NOTES=$(sed -n "/## \[${NEW_VERSION}\]/,/## \[/p" CHANGELOG.md | sed '$d' | tail -n +3)

    # Create release with gh CLI
    if command -v gh &> /dev/null; then
        echo "$RELEASE_NOTES" | gh release create "v${NEW_VERSION}" \
            --title "v${NEW_VERSION}" \
            --notes-file -

        echo -e "${GREEN}✓ Created GitHub release${NC}"
    else
        echo -e "${YELLOW}⚠ gh CLI not found. Skipping GitHub release creation.${NC}"
        echo -e "${YELLOW}  Install gh CLI: https://cli.github.com/${NC}"
        echo -e "${YELLOW}  Or create manually: ${REPO_URL}/releases/new?tag=v${NEW_VERSION}${NC}"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Release Complete! 🎉${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Version:  ${GREEN}v${NEW_VERSION}${NC}"
echo -e "Tag:      ${GREEN}v${NEW_VERSION}${NC}"
echo -e "Commit:   ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo ""
echo -e "View release: ${BLUE}${REPO_URL}/releases/tag/v${NEW_VERSION}${NC}"
echo -e "View commits: ${BLUE}${REPO_URL}/compare/v${CURRENT_VERSION}...v${NEW_VERSION}${NC}"
echo ""
