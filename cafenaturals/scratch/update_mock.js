const fs = require('fs');
const path = require('path');

const seedFile = fs.readFileSync(path.join(__dirname, '../src/lib/seed.ts'), 'utf8');

// Extract categories array
const catMatch = seedFile.match(/const categories = (\[[\s\S]*?\]);/);
const itemsMatch = seedFile.match(/const menuItems = (\[[\s\S]*?\]);/);

if (!catMatch || !itemsMatch) {
  console.error("Failed to parse seed.ts");
  process.exit(1);
}

let categoriesCode = catMatch[1];
let itemsCode = itemsMatch[1];

// We need to inject id and _id into the arrays for mock usage.
// For categories: Add id: 'cat-X', _id: 'cat-X'
let catIndex = 1;
categoriesCode = categoriesCode.replace(/\{ name: /g, () => {
  const idStr = `'cat-${catIndex}'`;
  catIndex++;
  return `{ id: ${idStr}, _id: ${idStr}, name: `;
});

// For items: Add id: 'item-X', _id: 'item-X', and resolve category_id
let itemIndex = 1;
itemsCode = itemsCode.replace(/\{ category_id: getCatId\('([^']+)'\)/g, (match, catName) => {
  // Find which cat index this name corresponds to
  const catRegex = new RegExp(`id: 'cat-(\\d+)', _id: 'cat-\\d+', name: '${catName}'`);
  const cMatch = categoriesCode.match(catRegex);
  if (!cMatch) {
    console.warn("Could not find cat id for " + catName);
    return match;
  }
  const idStr = `'item-${itemIndex}'`;
  itemIndex++;
  return `{ id: ${idStr}, _id: ${idStr}, category_id: 'cat-${cMatch[1]}'`;
});

const indexFile = path.join(__dirname, '../src/actions/index.ts');
let indexContent = fs.readFileSync(indexFile, 'utf8');

// Replace mockCategories block
const mockCatRegex = /mockCategories: \[[\s\S]*?\],[\s]*mockMenuItems:/;
indexContent = indexContent.replace(mockCatRegex, `mockCategories: ${categoriesCode},\n    mockMenuItems:`);

// Replace mockMenuItems block
const mockItemRegex = /mockMenuItems: \[[\s\S]*?\],[\s]*mockOffer:/;
indexContent = indexContent.replace(mockItemRegex, `mockMenuItems: ${itemsCode},\n    mockOffer:`);

fs.writeFileSync(indexFile, indexContent);
console.log('Successfully updated mock data in src/actions/index.ts');
