import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Location, isGenericZone, saveLocation } from '@/lib/inventory';

interface LocationHeaderProps {
  location: Location;
  onChange: (location: Location) => void;
}

export function LocationHeader({ location, onChange }: LocationHeaderProps) {
  const isGeneric = isGenericZone(location.pasillo);

  useEffect(() => {
    saveLocation(location);
  }, [location]);

  const handleChange = (field: keyof Location, value: string) => {
    const updated = { ...location, [field]: value.toUpperCase() };
    onChange(updated);
  };

  return (
    <header className="sticky top-0 z-40 bg-primary shadow-lg">
      <div className="px-safe py-3">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-primary-foreground" />
          <span className="text-sm font-semibold text-primary-foreground tracking-wide">
            UBICACIÓN ACTUAL
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pasillo" className="text-xs font-medium text-primary-foreground/80">
              PASILLO *
            </Label>
            <Input
              id="pasillo"
              value={location.pasillo}
              onChange={(e) => handleChange('pasillo', e.target.value)}
              placeholder="A1"
              className="h-12 text-center font-bold text-lg bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:bg-primary-foreground/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="columna" className="text-xs font-medium text-primary-foreground/80">
              COLUMNA {!isGeneric && '*'}
            </Label>
            <Input
              id="columna"
              value={location.columna}
              onChange={(e) => handleChange('columna', e.target.value)}
              placeholder={isGeneric ? '-' : '01'}
              disabled={isGeneric}
              className="h-12 text-center font-bold text-lg bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:bg-primary-foreground/20 disabled:opacity-40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="leja" className="text-xs font-medium text-primary-foreground/80">
              LEJA {!isGeneric && '*'}
            </Label>
            <Input
              id="leja"
              value={location.leja}
              onChange={(e) => handleChange('leja', e.target.value)}
              placeholder={isGeneric ? '-' : '1'}
              disabled={isGeneric}
              className="h-12 text-center font-bold text-lg bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:bg-primary-foreground/20 disabled:opacity-40"
            />
          </div>
        </div>

        {isGeneric && (
          <p className="mt-2 text-xs text-primary-foreground/60 text-center">
            Zona genérica detectada - Columna y Leja opcionales
          </p>
        )}
      </div>
    </header>
  );
}
