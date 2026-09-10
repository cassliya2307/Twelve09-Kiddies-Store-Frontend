from pathlib import Path

root = Path('src/app')
removed = 0
for path in root.rglob('*.tsx'):
    if path.name == 'layout.tsx':
        continue
    text = path.read_text(encoding='utf-8')
    original = text
    text = text.replace("import { Header } from '@/components/layout/Header';\n", '')
    text = text.replace('\n      <Header />', '')
    text = text.replace('\n        <Header />', '')
    text = text.replace('\n    <Header />', '')
    text = text.replace('\n          <Header />', '')
    text = text.replace('<Header />', '')
    if text != original:
        removed += 1
        path.write_text(text, encoding='utf-8')

print(f'Removed duplicate route-level header imports/render tags from {removed} files.')
