import { createItem, CONDITION, PRIORITY } from '../models/item'
import { createKit } from '../models/kit'
import { createSac, TRIP_TYPES } from '../models/sac'

export function generateTestData() {
  const newItems = [
    createItem({ name: 'Tente 2 places', categoryId: 'cat-abri', brand: 'MSR', model: 'Hubba Hubba NX', weight: 1800, quantity: 1, length: 50, width: 13, depth: 13, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, isFavorite: true, purchaseDate: '2025-04-15', purchasePrice: 450, notes: 'Montage en <5 min, plancher intégré.' }),
    createItem({ name: 'Duvet -10°C', categoryId: 'cat-abri', brand: 'Cumulus', weight: 950, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.INDISPENSABLE, isFavorite: true, purchaseDate: '2025-03-10', purchasePrice: 320, notes: 'Lavage à 30°C, séchage naturel uniquement.' }),
    createItem({ name: 'Matelas gonflable', categoryId: 'cat-abri', brand: 'Therm-a-Rest', model: 'NeoAir', weight: 510, quantity: 1, length: 27, width: 11, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 180 }),
    createItem({ name: 'Coussin gonflable', categoryId: 'cat-abri', brand: 'Sea to Summit', weight: 60, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, purchasePrice: 25 }),
    createItem({ name: 'Réchaud à gaz', categoryId: 'cat-cuisine', brand: 'MSR', model: 'PocketRocket Deluxe', weight: 73, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, isFavorite: true, purchaseDate: '2025-05-20', purchasePrice: 85 }),
    createItem({ name: 'Gaz cartouche', categoryId: 'cat-cuisine', brand: 'MSR', model: 'IsoPro 230g', weight: 370, quantity: 2, condition: CONDITION.USAGE, priority: PRIORITY.IMPORTANT, isConsumable: true, consumableType: 'fuel', fullWeight: 370, dryWeight: 140, purchaseDate: '2026-01-10', purchasePrice: 8, notes: 'Vérifier la date de péremption.' }),
    createItem({ name: 'Casserole Titanium 1.3L', categoryId: 'cat-cuisine', brand: 'Toaks', weight: 125, quantity: 1, length: 14, width: 11, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 55 }),
    createItem({ name: 'Gourde souple', categoryId: 'cat-cuisine', brand: 'Platypus', model: 'SoftBottle 2L', weight: 40, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, isConsumable: true, consumableType: 'water', volume: 2, purchasePrice: 15 }),
    createItem({ name: 'T-shirt mérinos 160', categoryId: 'cat-vetements', brand: 'Icebreaker', weight: 150, quantity: 2, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, purchaseDate: '2025-06-01', purchasePrice: 60 }),
    createItem({ name: 'Pantalon de randonnée', categoryId: 'cat-vetements', brand: 'Fjällräven', weight: 350, quantity: 1, condition: CONDITION.USAGE, priority: PRIORITY.IMPORTANT, purchasePrice: 120 }),
    createItem({ name: 'Veste imperméable Gore-Tex', categoryId: 'cat-vetements', brand: 'Millet', weight: 420, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 250 }),
    createItem({ name: 'Sac à dos', categoryId: 'cat-sac', brand: 'Osprey', model: 'Exos 48', weight: 1150, quantity: 1, volume: 48, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, isWorn: true, isFavorite: true, purchasePrice: 180 }),
    createItem({ name: 'Poche à eau', categoryId: 'cat-cuisine', brand: 'Platypus', model: 'Hoser 3L', weight: 130, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, isConsumable: true, consumableType: 'water', volume: 3, purchasePrice: 28 }),
    createItem({ name: 'Trousse de secours', categoryId: 'cat-securite', brand: '', weight: 200, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchaseDate: '2025-09-01', purchasePrice: 35, notes: 'Vérifier la péremption tous les 6 mois.' }),
    createItem({ name: 'GPS de randonnée', categoryId: 'cat-navigation', brand: 'Garmin', model: 'eTrex 22x', weight: 141, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, purchasePrice: 200 }),
    createItem({ name: 'Lampe frontale', categoryId: 'cat-navigation', brand: 'Petzl', model: 'Actik Core', weight: 80, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.INDISPENSABLE, purchasePrice: 65 }),
    createItem({ name: 'Carte IGN 1:25000', categoryId: 'cat-navigation', brand: 'IGN', weight: 50, quantity: 1, length: 24, width: 12, condition: CONDITION.BON, priority: PRIORITY.INDISPENSABLE, purchasePrice: 12 }),
    createItem({ name: 'Brosse à dents pliable', categoryId: 'cat-hygiene', brand: 'Sea to Summit', weight: 20, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.OPTIONNEL, purchasePrice: 8 }),
    createItem({ name: 'Crème solaire SPF50', categoryId: 'cat-hygiene', brand: '', weight: 80, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, isConsumable: true, consumableType: 'other', purchaseDate: '2026-02-15', purchasePrice: 12, notes: 'Sensible aux températures >50°C.' }),
    createItem({ name: 'Couteau suisse', categoryId: 'cat-divers', brand: 'Victorinox', model: 'Climber', weight: 75, quantity: 1, condition: CONDITION.BON, priority: PRIORITY.IMPORTANT, purchasePrice: 35 }),
    createItem({ name: 'Assiette pliable', categoryId: 'cat-cuisine', brand: 'Sea to Summit', model: 'DeltaLight', weight: 55, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, purchasePrice: 18 }),
    createItem({ name: 'Mug plastique', categoryId: 'cat-cuisine', brand: 'Sea to Summit', weight: 30, quantity: 1, condition: CONDITION.NEUF, priority: PRIORITY.OPTIONNEL, purchasePrice: 12 }),
  ]

  const itemIndex = {}
  for (const item of newItems) {
    const key = item.name.split(' ').slice(0, 2).join(' ')
    itemIndex[key] = item.id
  }

  const messKit = createKit({
    name: 'Couvert & Vaisselle',
    description: 'Assiette et mug',
    icon: 'tools',
    color: '#84cc16',
    itemEntries: [
      { itemId: itemIndex['Assiette pliable'], quantity: 1 },
      { itemId: itemIndex['Mug plastique'], quantity: 1 },
    ],
  })

  const newKits = [
    createKit({
      name: 'Cuisine légère',
      description: 'Kit cuisine pour 1 personne',
      icon: 'cook',
      color: '#f59e0b',
      itemEntries: [
        { itemId: itemIndex['Réchaud à'], quantity: 1 },
        { itemId: itemIndex['Gaz cartouche'], quantity: 2 },
        { itemId: itemIndex['Casserole Titanium'], quantity: 1 },
        { itemId: itemIndex['Gourde souple'], quantity: 1 },
      ],
      subKitEntries: [{ kitId: messKit.id }],
    }),
    createKit({
      name: 'Navigation',
      description: 'Kit navigation et orientation',
      icon: 'compass',
      color: '#06b6d4',
      itemEntries: [
        { itemId: itemIndex['GPS de'], quantity: 1 },
        { itemId: itemIndex['Lampe frontale'], quantity: 1 },
        { itemId: itemIndex['Carte IGN'], quantity: 1 },
      ],
    }),
    messKit,
  ]

  const newSacs = [
    createSac({
      name: 'Trek Jura 3 jours',
      description: 'Tour du Jura en 3 jours - mai',
      destination: 'Jura',
      tripDate: '2026-08-15',
      duration: 3,
      type: TRIP_TYPES.TREK,
      entries: [
        { entryId: 'e-gen-1', type: 'item', itemId: itemIndex['Tente 2'], quantity: 1 },
        { entryId: 'e-gen-2', type: 'item', itemId: itemIndex['Duvet -10°C'], quantity: 1 },
        { entryId: 'e-gen-3', type: 'item', itemId: itemIndex['Matelas gonflable'], quantity: 1 },
        { entryId: 'e-gen-4', type: 'item', itemId: itemIndex['Coussin gonflable'], quantity: 1 },
        { entryId: 'e-gen-5', type: 'kit', kitId: newKits[0].id },
        { entryId: 'e-gen-6', type: 'item', itemId: itemIndex['T-shirt mérinos'], quantity: 2 },
        { entryId: 'e-gen-7', type: 'item', itemId: itemIndex['Pantalon de'], quantity: 1 },
        { entryId: 'e-gen-8', type: 'item', itemId: itemIndex['Veste imperméable'], quantity: 1 },
        { entryId: 'e-gen-9', type: 'item', itemId: itemIndex['Poche à'], quantity: 1 },
        { entryId: 'e-gen-10', type: 'item', itemId: itemIndex['Trousse de'], quantity: 1 },
        { entryId: 'e-gen-11', type: 'kit', kitId: newKits[1].id },
        { entryId: 'e-gen-12', type: 'item', itemId: itemIndex['Brosse à'], quantity: 1 },
        { entryId: 'e-gen-13', type: 'item', itemId: itemIndex['Crème solaire'], quantity: 1 },
        { entryId: 'e-gen-14', type: 'item', itemId: itemIndex['Couteau suisse'], quantity: 1 },
        { entryId: 'e-gen-15', type: 'item', itemId: itemIndex['Gaz cartouche'], quantity: 1 },
      ],
      packingState: {},
      packingFill: {
        [`e-gen-9:${itemIndex['Poche à']}:`]: 'full',
        [`e-gen-15:${itemIndex['Gaz cartouche']}:`]: 'full',
      },
    }),
  ]

  return { items: newItems, kits: newKits, sacs: newSacs }
}
