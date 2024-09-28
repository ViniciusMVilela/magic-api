function validateCommanderAndCards(commander: any, cards: any[]): { valid: boolean; message: string } | null {
  if (!commander || !cards || cards.length === 0) {
    return { valid: false, message: 'Comandante ou cartas não fornecidos.' };
  }
  return null;
}

function validateCardCount(cards: any[]): { valid: boolean; message: string } | null {
  if (cards.length < 1 || cards.length > 99) {
    return { valid: false, message: 'O deck deve conter entre 1 e 99 cartas além do comandante.' };
  }
  return null;
}

function validateCardColors(commander: any, cards: any[]): { valid: boolean; message: string } | null {
  const commanderColors = commander.color_identity || [];
  const invalidCards = cards.filter(card => {
    const cardColors = card.color_identity || [];
    return !cardColors.every(color => commanderColors.includes(color));
  });

  if (invalidCards.length > 0) {
    return { valid: false, message: `Cartas fora da identidade de cor do comandante: ${invalidCards.map(card => card.name).join(', ')}.` };
  }
  return null;
}

function validateDuplicateCards(cards: any[]): { valid: boolean; message: string } | null {
  const cardCounts = cards.reduce((acc, card) => {
    if (!card.name) {
      console.warn('Carta sem nome encontrada:', card);
      return acc;
    }
    acc[card.name] = (acc[card.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Contagem de cartas:', cardCounts);

  const duplicateCards = Object.entries(cardCounts).filter(([name, count]) => {
    return (count as number) > 1 &&
      !['plains', 'island', 'swamp', 'mountain', 'forest'].some(terrain => name.toLowerCase().includes(terrain));
  });

  if (duplicateCards.length > 0) {
    return { valid: false, message: `Cartas duplicadas (exceto terrenos básicos): ${duplicateCards.map(([name]) => name).join(', ')}.` };
  }
  return null;
}

export function validateCommanderDeck(commander: any, cards: any[]): { valid: boolean; message: string } {
  let result;

  result = validateCommanderAndCards(commander, cards);
  if (result) return result;

  result = validateCardCount(cards);
  if (result) return result;

  result = validateCardColors(commander, cards);
  if (result) return result;

  result = validateDuplicateCards(cards);
  if (result) return result;

  return { valid: true, message: 'Deck válido.' };
}