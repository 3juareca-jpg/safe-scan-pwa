// Inventory data management utilities

export interface Location {
  pasillo: string;
  columna: string;
  leja: string;
}

export interface InventoryItem {
  id: string;
  codigo: string;
  cantidad: number;
  ubicacion: Location;
  timestamp: number;
}

const STORAGE_KEY = 'inventory-pro-data';
const LOCATION_KEY = 'inventory-pro-location';

// Generic zones that don't require columna/leja
const GENERIC_ZONES = [
  'recepcion',
  'recepción',
  'nave',
  'suelo',
  'zona',
  'entrada',
  'salida',
  'expedicion',
  'expedición',
  'devoluciones',
  'picking',
];

export function isGenericZone(pasillo: string): boolean {
  const normalized = pasillo.toLowerCase().trim();
  return GENERIC_ZONES.some(zone => normalized.includes(zone));
}

export function getLocationKey(ubicacion: Location): string {
  return `${ubicacion.pasillo}-${ubicacion.columna}-${ubicacion.leja}`.toLowerCase();
}

export function getInventory(): InventoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveInventory(items: InventoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addItem(item: Omit<InventoryItem, 'id' | 'timestamp'>): InventoryItem {
  const items = getInventory();
  const newItem: InventoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  items.unshift(newItem);
  saveInventory(items);
  return newItem;
}

export function findDuplicate(codigo: string, ubicacion: Location): InventoryItem | undefined {
  const items = getInventory();
  const locationKey = getLocationKey(ubicacion);
  return items.find(
    item => item.codigo.toLowerCase() === codigo.toLowerCase() && 
            getLocationKey(item.ubicacion) === locationKey
  );
}

export function updateItem(id: string, updates: Partial<Omit<InventoryItem, 'id'>>): void {
  const items = getInventory();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates, timestamp: Date.now() };
    saveInventory(items);
  }
}

export function deleteItem(id: string): void {
  const items = getInventory().filter(item => item.id !== id);
  saveInventory(items);
}

export function sumQuantity(id: string, additionalQty: number): void {
  const items = getInventory();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index].cantidad += additionalQty;
    items[index].timestamp = Date.now();
    saveInventory(items);
  }
}

export function replaceQuantity(id: string, newQty: number): void {
  updateItem(id, { cantidad: newQty });
}

// Persist current location header
export function getSavedLocation(): Location {
  try {
    const data = localStorage.getItem(LOCATION_KEY);
    return data ? JSON.parse(data) : { pasillo: '', columna: '', leja: '' };
  } catch {
    return { pasillo: '', columna: '', leja: '' };
  }
}

export function saveLocation(location: Location): void {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
}

// Export to CSV
export function exportToCSV(): string {
  const items = getInventory();
  const headers = ['Código', 'Cantidad', 'Pasillo', 'Columna', 'Leja', 'Fecha'];
  const rows = items.map(item => [
    item.codigo,
    item.cantidad.toString(),
    item.ubicacion.pasillo,
    item.ubicacion.columna,
    item.ubicacion.leja,
    new Date(item.timestamp).toLocaleString('es-ES'),
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
}

export function downloadCSV(): void {
  const csv = exportToCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
