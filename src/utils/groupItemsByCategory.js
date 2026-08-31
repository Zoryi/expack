export function groupItemsByCategory(items, categories) {
  const order = new Map()
  const sortedCats = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
  sortedCats.forEach((c, i) => order.set(c.id, i))

  const groups = {}
  const groupOrder = []
  for (const item of items) {
    const catId = item.categoryId
    if (!(catId in groups)) {
      groups[catId] = []
      groupOrder.push(catId)
    }
    groups[catId].push(item)
  }

  groupOrder.sort((a, b) => {
    const ia = order.get(a) ?? Number.MAX_SAFE_INTEGER
    const ib = order.get(b) ?? Number.MAX_SAFE_INTEGER
    if (ia !== ib) return ia - ib
    return (a ?? '').localeCompare(b ?? '', 'fr', { sensitivity: 'base' })
  })

  const byName = (a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) ||
    (a.brand ?? '').localeCompare(b.brand ?? '', 'fr', { sensitivity: 'base' }) ||
    (a.model ?? '').localeCompare(b.model ?? '', 'fr', { sensitivity: 'base' })

  return groupOrder.map(catId => {
    const cat = categories.find(c => c.id === catId)
    return {
      catId,
      category: cat,
      name: cat?.name || 'Sans catégorie',
      icon: cat?.icon || 'package',
      items: [...groups[catId]].sort(byName),
    }
  })
}
