'use client';

import { useEffect, useRef } from 'react';

export function useDiscoverState(filters: any, setFilters: (f: any) => void) {
  const restored = useRef(false);

  // Restaurar al montar
  useEffect(() => {
    if (restored.current) return;

    const raw = sessionStorage.getItem('discover-state');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);

      if (parsed.filters) {
        setFilters(parsed.filters);
      }

      requestAnimationFrame(() => {
        window.scrollTo(0, parsed.scrollY || 0);
      });

      restored.current = true;
    } catch {}
  }, [setFilters]);

  // Guardar en cada cambio de filtros
  useEffect(() => {
    const current = {
      scrollY: window.scrollY,
      filters,
    };

    sessionStorage.setItem('discover-state', JSON.stringify(current));
  }, [filters]);
}
