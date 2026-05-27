'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PedalCard from '@/components/PedalCard';

export default function CollectionPage() {
  const router = useRouter();

  // -----------------------------
  // DATA
  // -----------------------------
  const [pedals, setPedals] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('pedals').select('*');
      setPedals(data || []);
    }
    load();
  }, []);

  // -----------------------------
  // OPEN PEDAL (guardar scroll)
  // -----------------------------
  const openPedal = (href: string) => {
    const raw = sessionStorage.getItem('collection-state');
    let parsed = {};

    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {}

    sessionStorage.setItem(
      'collection-state',
      JSON.stringify({
        ...parsed,
        scrollY: window.scrollY,
      })
    );

    router.push(href);
  };

  // -----------------------------
  // RESTAURAR SCROLL AL VOLVER
  // -----------------------------
  useEffect(() => {
    const raw = sessionStorage.getItem('collection-state');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      requestAnimationFrame(() => {
        window.scrollTo(0, parsed.scrollY || 0);
      });
    } catch {}
  }, []);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
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
