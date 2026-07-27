export function guessCategory(note: string = ''): string | null {
  const lowerNote = note.toLowerCase();

  const rules = [
    {
      keywords: ['shell', 'total', 'gas', 'diesel', 'fuel', 'petrol'],
      category: 'Fuel',
    },
    {
      keywords: ['salary', 'wage', 'pay', 'labor', 'labour'],
      category: 'Salary',
    },
    { keywords: ['rent', 'lease', 'landlord'], category: 'Rent' },
    {
      keywords: ['electric', 'water', 'internet', 'wifi', 'utility'],
      category: 'Utilities',
    },
    {
      keywords: ['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'cafe'],
      category: 'Food',
    },
    {
      keywords: ['uber', 'taxi', 'bus', 'transport', 'ticket'],
      category: 'Transport',
    },
    {
      keywords: ['cement', 'steel', 'wood', 'material', 'supply'],
      category: 'Materials',
    },
    {
      keywords: ['oil', 'filter', 'repair', 'fix', 'service'],
      category: 'Maintenance',
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => lowerNote.includes(keyword))) {
      return rule.category;
    }
  }
  return null; // No match found
}
