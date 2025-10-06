#!/bin/bash

# Fix all incorrect imports in UI components
declare -A fixes=(
  ["components/ui/alert-dialog.tsx"]="@radix-ui/react-alert-dialog"
  ["components/ui/aspect-ratio.tsx"]="@radix-ui/react-aspect-ratio"
  ["components/ui/avatar.tsx"]="@radix-ui/react-avatar"
  ["components/ui/badge.tsx"]="@radix-ui/react-slot"
  ["components/ui/breadcrumb.tsx"]="@radix-ui/react-slot"
  ["components/ui/collapsible.tsx"]="@radix-ui/react-collapsible"
  ["components/ui/form.tsx"]="@radix-ui/react-slot"
  ["components/ui/hover-card.tsx"]="@radix-ui/react-hover-card"
  ["components/ui/navigation-menu.tsx"]="@radix-ui/react-navigation-menu"
  ["components/ui/popover.tsx"]="@radix-ui/react-popover"
  ["components/ui/progress.tsx"]="@radix-ui/react-progress"
  ["components/ui/radio-group.tsx"]="@radix-ui/react-radio-group"
  ["components/ui/scroll-area.tsx"]="@radix-ui/react-scroll-area"
  ["components/ui/separator.tsx"]="@radix-ui/react-separator"
  ["components/ui/sheet.tsx"]="@radix-ui/react-dialog"
  ["components/ui/slider.tsx"]="@radix-ui/react-slider"
  ["components/ui/switch.tsx"]="@radix-ui/react-switch"
  ["components/ui/tabs.tsx"]="@radix-ui/react-tabs"
  ["components/ui/tooltip.tsx"]="@radix-ui/react-tooltip"
)

for file in "${!fixes[@]}"; do
  if [ -f "$file" ]; then
    correct_import="${fixes[$file]}"
    # Replace any @radix-ui import with the correct one
    sed -i '' "s|@radix-ui/react-[^\"]*|$correct_import|g" "$file"
    echo "Fixed $file -> $correct_import"
  fi
done
