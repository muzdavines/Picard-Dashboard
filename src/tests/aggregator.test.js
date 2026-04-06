import { describe, it, expect } from 'vitest'
import { aggregateIngredients, buildWalmartSearchUrl } from '../services/ingredientAggregator.js'
import { getCurrentWeekId, getWeekIdForDate } from '../utils/weekId.js'

// ---- aggregateIngredients ----

describe('aggregateIngredients', () => {
  const mockMeal1 = {
    mealId: 'test_meal_1',
    name: 'Test Meal 1',
    ingredients: [
      { ingredientId: 'i1', name: 'ground beef', qty: 1, unit: 'lb', storeSection: 'meat', isPantryStaple: false, walmartSearchTerm: 'ground beef 1 lb' },
      { ingredientId: 'i2', name: 'tomato', qty: 2, unit: 'whole', storeSection: 'produce', isPantryStaple: false, walmartSearchTerm: 'tomatoes fresh' },
      { ingredientId: 'i3', name: 'salt', qty: 1, unit: 'tsp', storeSection: 'pantry', isPantryStaple: true, walmartSearchTerm: 'salt' },
    ],
  }

  const mockMeal2 = {
    mealId: 'test_meal_2',
    name: 'Test Meal 2',
    ingredients: [
      { ingredientId: 'i4', name: 'ground beef', qty: 1.5, unit: 'lb', storeSection: 'meat', isPantryStaple: false, walmartSearchTerm: 'ground beef 1.5 lb' },
      { ingredientId: 'i5', name: 'shredded cheese', qty: 8, unit: 'oz', storeSection: 'dairy', isPantryStaple: false, walmartSearchTerm: 'shredded cheese 8 oz' },
    ],
  }

  it('returns empty result for no meals', () => {
    const result = aggregateIngredients([])
    expect(result.items).toHaveLength(0)
    expect(result.suppressedItems).toHaveLength(0)
  })

  it('returns empty result for null input', () => {
    const result = aggregateIngredients(null)
    expect(result.items).toHaveLength(0)
  })

  it('skips pantry staples by default', () => {
    const result = aggregateIngredients([mockMeal1])
    const names = result.items.map(i => i.name)
    expect(names).not.toContain('salt')
  })

  it('deduplicates same ingredient across meals and sums quantities', () => {
    const result = aggregateIngredients([mockMeal1, mockMeal2])
    const beef = result.items.find(i => i.name === 'ground beef')
    expect(beef).toBeDefined()
    expect(beef.qty).toBe(2.5) // 1 + 1.5
  })

  it('collects all unique non-pantry-staple ingredients', () => {
    const result = aggregateIngredients([mockMeal1, mockMeal2])
    const names = result.items.map(i => i.name)
    expect(names).toContain('ground beef')
    expect(names).toContain('tomato')
    expect(names).toContain('shredded cheese')
  })

  it('groups items by store section', () => {
    const result = aggregateIngredients([mockMeal1, mockMeal2])
    expect(result.itemsBySection.meat).toBeDefined()
    expect(result.itemsBySection.meat.some(i => i.name === 'ground beef')).toBe(true)
    expect(result.itemsBySection.produce.some(i => i.name === 'tomato')).toBe(true)
    expect(result.itemsBySection.dairy.some(i => i.name === 'shredded cheese')).toBe(true)
  })

  it('applies pantry overrides to suppress items', () => {
    const pantryOverrides = {
      'ground beef': { suppressed: true },
    }
    const result = aggregateIngredients([mockMeal1, mockMeal2], pantryOverrides)
    const names = result.items.map(i => i.name)
    expect(names).not.toContain('ground beef')
    expect(result.suppressedItems.some(i => i.name === 'ground beef')).toBe(true)
  })

  it('does not suppress items without pantry override', () => {
    const pantryOverrides = {
      'some other item': { suppressed: true },
    }
    const result = aggregateIngredients([mockMeal1], pantryOverrides)
    const names = result.items.map(i => i.name)
    expect(names).toContain('tomato')
  })

  it('attaches walmart URLs to items', () => {
    const result = aggregateIngredients([mockMeal1])
    for (const item of result.items) {
      expect(item.walmartUrl).toBeDefined()
      expect(item.walmartUrl).toMatch(/walmart\.com\/search/)
    }
  })
})

// ---- buildWalmartSearchUrl ----

describe('buildWalmartSearchUrl', () => {
  it('correctly encodes search terms', () => {
    const url = buildWalmartSearchUrl('ground beef 80/20 2 lb')
    expect(url).toBe('https://www.walmart.com/search?q=ground%20beef%2080%2F20%202%20lb')
  })

  it('encodes special characters', () => {
    const url = buildWalmartSearchUrl('chicken & rice')
    expect(url).toContain('chicken')
    expect(url).toContain('%26')
  })

  it('handles empty string gracefully', () => {
    const url = buildWalmartSearchUrl('')
    expect(url).toBe('https://www.walmart.com')
  })

  it('handles null gracefully', () => {
    const url = buildWalmartSearchUrl(null)
    expect(url).toBe('https://www.walmart.com')
  })

  it('returns a valid URL', () => {
    const url = buildWalmartSearchUrl('shredded cheese 8 oz')
    expect(() => new URL(url)).not.toThrow()
    expect(url.startsWith('https://www.walmart.com/search?q=')).toBe(true)
  })
})

// ---- getCurrentWeekId ----

describe('getCurrentWeekId', () => {
  it('returns a string in YYYY-WNN format', () => {
    const id = getCurrentWeekId()
    expect(id).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('year is reasonable', () => {
    const id = getCurrentWeekId()
    const year = parseInt(id.split('-W')[0])
    expect(year).toBeGreaterThan(2020)
    expect(year).toBeLessThan(2100)
  })

  it('week number is between 1 and 53', () => {
    const id = getCurrentWeekId()
    const week = parseInt(id.split('-W')[1])
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(53)
  })

  it('returns correct week for a known date (2024-01-08 = 2024-W01)', () => {
    // 2024-01-08 falls in ISO week 1 of 2024 (week containing Jan 4)
    const id = getWeekIdForDate(new Date('2024-01-08'))
    expect(id).toBe('2024-W01')
  })

  it('returns correct ISO week for 2024-01-15 = 2024-W02', () => {
    const id = getWeekIdForDate(new Date('2024-01-15'))
    expect(id).toBe('2024-W02')
  })

  it('returns correct ISO week for 2024-01-01 = 2023-W52 (ISO year rollover)', () => {
    // Jan 1 2024 is in the last ISO week of 2023
    const id = getWeekIdForDate(new Date('2024-01-01'))
    expect(id).toBe('2023-W52')
  })

  it('produces week IDs that sort chronologically', () => {
    const ids = [
      getWeekIdForDate(new Date('2024-03-01')),
      getWeekIdForDate(new Date('2024-01-15')),
      getWeekIdForDate(new Date('2024-12-01')),
    ]
    const sorted = [...ids].sort()
    expect(sorted[0]).toBe(ids[1]) // Jan is earliest
    expect(sorted[2]).toBe(ids[2]) // Dec is latest
  })
})
