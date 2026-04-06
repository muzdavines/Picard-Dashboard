/**
 * Aggregates ingredients from multiple winning meals, deduplicates,
 * applies pantry overrides, groups by store section.
 *
 * @param {Array} winningMeals - Array of meal objects from MEAL_LIBRARY
 * @param {Object} pantryOverrides - Map of normalized ingredient name → { suppressed: bool, suppressedAt: timestamp }
 * @returns {{ items: Array, itemsBySection: Object, suppressedItems: Array }}
 */
export function aggregateIngredients(winningMeals, pantryOverrides = {}) {
  if (!winningMeals || winningMeals.length === 0) {
    return { items: [], itemsBySection: {}, suppressedItems: [] }
  }

  const rawIngredients = []

  for (const meal of winningMeals) {
    if (!meal || !meal.ingredients) continue
    for (const ing of meal.ingredients) {
      // Skip pantry staples by default unless explicitly requested
      if (ing.isPantryStaple) continue
      rawIngredients.push({
        ...ing,
        fromMeal: meal.name,
        fromMealId: meal.mealId,
      })
    }
  }

  // Deduplicate by normalized name, sum quantities for same unit
  const dedupMap = new Map()

  for (const ing of rawIngredients) {
    const key = ing.name.toLowerCase().trim()
    if (dedupMap.has(key)) {
      const existing = dedupMap.get(key)
      if (existing.unit === ing.unit) {
        existing.qty += ing.qty
        existing.fromMeals = [...new Set([...existing.fromMeals, ing.fromMeal])]
      } else {
        // Mixed units — flag it, keep both entries with a suffix
        const unitKey = `${key}__${ing.unit}`
        if (dedupMap.has(unitKey)) {
          const u = dedupMap.get(unitKey)
          u.qty += ing.qty
          u.fromMeals = [...new Set([...u.fromMeals, ing.fromMeal])]
        } else {
          dedupMap.set(unitKey, {
            ...ing,
            fromMeals: [ing.fromMeal],
            mixedUnits: true,
            walmartUrl: buildWalmartSearchUrl(ing.walmartSearchTerm),
          })
        }
      }
    } else {
      dedupMap.set(key, {
        ...ing,
        fromMeals: [ing.fromMeal],
        mixedUnits: false,
        walmartUrl: buildWalmartSearchUrl(ing.walmartSearchTerm),
      })
    }
  }

  const allItems = Array.from(dedupMap.values())

  // Apply pantry overrides
  const items = []
  const suppressedItems = []

  for (const item of allItems) {
    const key = item.name.toLowerCase().trim()
    const override = pantryOverrides[key]
    if (override && override.suppressed) {
      suppressedItems.push({ ...item, suppressedReason: 'pantry-override' })
    } else {
      items.push(item)
    }
  }

  // Group by storeSection
  const SECTION_ORDER = ['meat', 'produce', 'dairy', 'frozen', 'pantry']
  const itemsBySection = {}
  for (const section of SECTION_ORDER) {
    itemsBySection[section] = []
  }

  for (const item of items) {
    const section = item.storeSection || 'pantry'
    if (!itemsBySection[section]) {
      itemsBySection[section] = []
    }
    itemsBySection[section].push(item)
  }

  return { items, itemsBySection, suppressedItems }
}

/**
 * Build a Walmart search URL for an ingredient search term.
 */
export function buildWalmartSearchUrl(walmartSearchTerm) {
  if (!walmartSearchTerm) return 'https://www.walmart.com'
  return `https://www.walmart.com/search?q=${encodeURIComponent(walmartSearchTerm)}`
}
