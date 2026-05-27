'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PedalCard from '@/components/PedalCard';
import FiltersBar from '@/components/FiltersBar';
import { useDiscoverState } from '@/app/hooks/useDiscoverState';

export default function DiscoverPage() {
  const router = useRouter();

  // -----------------------------
  // FILTROS
  // -----------------------------
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [subtypeFilter, setSubtypeFilter] = useState('all');

  // Persistencia de filtros + scroll
  useDiscoverState(
    {
      brandFilter,
      modelFilter,
      typeFilter,
      subtypeFilter,
    },
    (restored) => {
      setBrandFilter(restored.brandFilter || 'all');
      setModelFilter(restored.modelFilter || 'all');
      setTypeFilter(restored.typeFilter || 'all');
      setSubtypeFilter(restored.subtypeFilter || 'all');
    }
  );

  // -----------------------------
  // DATA
  // -----------------------------
  const [pedals, setPedals] = useState([]);

  useEffect(() => {
    async function load() {
      let query = supabase.from('pedals').select('*');

      if (brandFilter !== 'all') query = query.eq('brand', brandFilter);
      if (modelFilter !== 'all') query = query.eq('model', modelFilter);
      if (typeFilter !== 'all') query = query.eq('type', typeFilter);
      if (subtypeFilter !== 'all') query = query.eq('subtype', subtypeFilter);

      const { data } = await query;
      setPedals(data || []);
    }

    load();
  }, [brandFilter, modelFilter, typeFilter, subtypeFilter]);

  // -----------------------------
  // OPEN PEDAL (guardar scroll)
  // -----------------------------
  const openPedal = (href: string) => {
    const raw = sessionStorage.getItem('discover-state');
    let parsed = {};

    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {}

    sessionStorage.setItem(
      'discover-state',
      JSON.stringify({
        ...parsed,
        scrollY: window.scrollY,
      })
    );

    router.push(href);
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <FiltersBar
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        modelFilter={modelFilter}
        setModelFilter={setModelFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        subtypeFilter={subtypeFilter}
        setSubtypeFilter={setSubtypeFilter}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        {pedals.map((pedal: any) => (
          <button
            key={pedal.id}
            onClick={() => openPedal(`/pedal/${pedal.slug}`)}
            className="text-left"
          >
            <PedalCard pedal={pedal} />
          </button>
        ))}
      </div>
    </div>
  );
}
