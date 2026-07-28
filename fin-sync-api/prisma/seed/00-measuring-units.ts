import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

const MEASURING_UNITS = [
  // Weight
  { name: 'Kilograms (kg)', category: 'weight' },
  { name: 'Grams (g)', category: 'weight' },
  { name: 'Metric Tons', category: 'weight' },
  { name: 'Pounds (lbs)', category: 'weight' },
  { name: 'Ounces (oz)', category: 'weight' },

  // Volume
  { name: 'Liters (L)', category: 'volume' },
  { name: 'Milliliters (mL)', category: 'volume' },
  { name: 'Gallons', category: 'volume' },
  { name: 'Cubic Meters (m³)', category: 'volume' },
  { name: 'Barrels', category: 'volume' },

  // Length
  { name: 'Meters (m)', category: 'length' },
  { name: 'Centimeters (cm)', category: 'length' },
  { name: 'Millimeters (mm)', category: 'length' },
  { name: 'Feet (ft)', category: 'length' },
  { name: 'Inches (in)', category: 'length' },
  { name: 'Yards', category: 'length' },
  { name: 'Kilometers (km)', category: 'length' },

  // Count
  { name: 'Pieces (pcs)', category: 'count' },
  { name: 'Boxes', category: 'count' },
  { name: 'Packs', category: 'count' },
  { name: 'Dozens', category: 'count' },
  { name: 'Sets', category: 'count' },
  { name: 'Bags', category: 'count' },
  { name: 'Rolls', category: 'count' },
  { name: 'Sheets', category: 'count' },
  { name: 'Pallets', category: 'count' },

  // Time
  { name: 'Hours (hrs)', category: 'time' },
  { name: 'Days', category: 'time' },
  { name: 'Months', category: 'time' },

  // Area
  { name: 'Square Meters (m²)', category: 'area' },
  { name: 'Square Feet (ft²)', category: 'area' },
  { name: 'Acres', category: 'area' },
  { name: 'Hectares', category: 'area' },

  // Energy
  { name: 'Kilowatt Hours (kWh)', category: 'energy' },
  { name: 'Liters per Hour (L/hr)', category: 'rate' },
];

export async function seedMeasuringUnits(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('📐 Seeding Measuring Units...');

  for (const unit of MEASURING_UNITS) {
    const created = await prisma.measuringUnit.create({
      data: { name: unit.name },
    });
    ctx.measuringUnits[unit.name] = created.id;
    // Also store by short key
    const key = unit.name.split(' ')[0].toLowerCase();
    ctx.measuringUnits[key] = created.id;
  }

  console.log(`   ✅ Created ${MEASURING_UNITS.length} measuring units`);
}
