#!/bin/bash
# ============================================================
# Extract all source code into a single text file
# Usage: ./extract-code.sh academiq-admin
# ============================================================

TARGET="${1:-.}"

if [ ! -d "$TARGET" ]; then
  echo "Error: '$TARGET' is not a directory"
  exit 1
fi

cd "$TARGET" || exit 1

OUTPUT="../${TARGET}-codebase.txt"

# Extensions to include
EXTS="ts,tsx,js,jsx,css,json,html,svg,md"

# Directories to exclude
EXCLUDES="node_modules|.expo|dist|build|.git|.vscode|android|ios|coverage|.next"

echo "Extracting code from: $(pwd)"
echo "Output file: $(cd .. && pwd)/${TARGET}-codebase.txt"
echo ""

# Clear existing file
> "$OUTPUT"

# Header
{
  echo "=================================================="
  echo "PROJECT: $TARGET"
  echo "GENERATED: $(date)"
  echo "=================================================="
  echo ""
} >> "$OUTPUT"

# File count
TOTAL=0
LINES=0

# Find all source files and process them
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.expo/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.git/*" \
  -not -path "*/.vscode/*" \
  -not -path "*/android/*" \
  -not -path "*/ios/*" \
  -not -path "*/coverage/*" \
  -not -path "*/.next/*" \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
     -o -name "*.css" -o -name "*.json" -o -name "*.html" -o -name "*.svg" \
     -o -name "*.md" \) \
  | sort | while read -r file; do
  
  # Skip package-lock.json (huge, useless)
  if [[ "$file" == *"package-lock.json"* ]]; then
    continue
  fi
  
  # Print header for each file
  {
    echo ""
    echo "=================================================="
    echo "FILE: ${file#./}"
    echo "=================================================="
    cat "$file"
    echo ""
  } >> "$OUTPUT"
  
  TOTAL=$((TOTAL + 1))
  FILE_LINES=$(wc -l < "$file" 2>/dev/null || echo 0)
  LINES=$((LINES + FILE_LINES))
  
  printf "  + %-60s %5d lines\n" "${file#./}" "$FILE_LINES"
done

# Footer
{
  echo ""
  echo "=================================================="
  echo "END OF $TARGET"
  echo "=================================================="
} >> "$OUTPUT"

echo ""
echo "Done."
echo "Total lines: $(wc -l < "$OUTPUT")"
echo "Output: $(cd .. && pwd)/${TARGET}-codebase.txt"
