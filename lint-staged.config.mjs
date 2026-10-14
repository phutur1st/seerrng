export default {
  '**/*.{ts,tsx,js}': [
    'prettier --write',
    'eslint',
    'oxlint --config .oxlintrc.next.json',
  ],
  '**/*.{json,md,css}': ['prettier --write'],
};
