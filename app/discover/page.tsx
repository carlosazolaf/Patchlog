'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DiscoverPage() {
  const [pedals, setPedals] = useState<any[]>([])
  const [userPedals, setUserPedals] =
    useState<any[]>([])

  const [brands, setBrands] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [subtypes, setSubtypes] =
    useState<any[]>([])

  /*
    FILTERS
  */

  const [brandFilter, setBrandFilter] =
    useState('all')

  const [modelFilter, setModelFilter] =
    useState('all')

  const [typeFilter, setTypeFilter] =
    useState('all')

  const [subtypeFilter, setSubtypeFilter] =
    useState('all')

  /*
    LOAD
  */

  useEffect(() => {
    fetchData()
  }, [
    brandFilter,
    modelFilter,
    typeFilter,
    subtypeFilter
  ])

  /*
    FETCH
  */

  async function fetchData() {
    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .order('name', {
        ascending: true
      })
      .limit(300)

    /*
      FILTERS
    */

    if (brandFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'brand_id',
        brandFilter
      )
    }

    if (modelFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'pedal_id',
        modelFilter
      )
    }

    if (typeFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'type_id',
        typeFilter
      )
    }

    if (subtypeFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'subtype_id',
        subtypeFilter
      )
    }

    const { data: pedalsData } =
      await pedalsQuery

    /*
      LOOKUPS
    */

    const { data: brandsData } =
      await supabase
        .from('brand')
        .select('*')
        .order('brand', {
          ascending: true
        })

    const { data: typesData } =
      await supabase
        .from('type')
        .select('*')
        .order('type', {
          ascending: true
        })

    const { data: subtypesData } =
      await supabase
        .from('subtype')
        .select('*')
        .order('subtype', {
          ascending: true
        })

    /*
      USER PEDALS
    */

    const { data: userPedalsData } =
      await supabase
        .from('user_pedals')
        .select('*')

    /*
      ENRICH
    */

    const enriched = (pedalsData || []).map(
      (pedal) => {
        const brand = brandsData?.find(
          (b) =>
            Number(b.brand_id) ===
            Number(pedal.brand_id)
        )

        const type = typesData?.find(
          (t) =>
            Number(t.type_id) ===
            Number(pedal.type_id)
        )

        const subtype = subtypesData?.find(
          (s) =>
            Number(s.subtype_id) ===
            Number(pedal.subtype_id)
        )

        const userPedal =
          userPedalsData?.find(
            (u) =>
              Number(u.pedal_id) ===
              Number(pedal.pedal_id)
          )

        return {
          ...pedal,

          brand_name:
            brand?.brand || '',

          type_name:
            type?.type || '',

          subtype_name:
            subtype?.subtype || '',

          status:
            userPedal?.status || ''
        }
      }
    )

    setPedals(enriched)
    setUserPedals(userPedalsData || [])

    /*
      FILTERED TYPES
    */

    const filteredTypes = [
      ...new Map(
        enriched.map((p) => [
          p.type_id,
          {
            type_id: p.type_id,
            type: p.type_name
          }
        ])
      ).values()
    ]

    /*
      FILTERED SUBTYPES
    */

    const filteredSubtypes = [
      ...new Map(
        enriched.map((p) => [
          p.subtype_id,
          {
            subtype_id: p.subtype_id,
            subtype: p.subtype_name
          }
        ])
      ).values()
    ]

    setBrands(brandsData || [])
    setTypes(filteredTypes)
    setSubtypes(filteredSubtypes)
  }

  /*
    STATUS
  */

  async function setStatus(
    pedalId: number,
    status: string
  ) {
    const existing = userPedals.find(
      (p) =>
        Number(p.pedal_id) ===
        Number(pedalId)
    )

    if (existing) {
      await supabase
        .from('user_pedals')
        .update({ status })
        .eq('pedal_id', pedalId)
    } else {
      await supabase
        .from('user_pedals')
        .insert({
          pedal_id: pedalId,
          status
        })
    }

    fetchData()
  }

  /*
    MODELS
  */

  const models = useMemo(() => {
    return [...pedals].sort((a, b) =>
      (a.name || '').localeCompare(
        b.name || ''
      )
    )
  }, [pedals])

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        {/* HEADER */}
        <div className="mb-10">
          <div className="mb-6">
            <p className="text-sm tracking-[0.45em] uppercase text-[#4f4942]">
              PATCHLOG
            </p>

            <div className="flex items-center mt-2">
              <div className="h-px bg-[#b8afa3] flex-1" />

              <img
                src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
                alt="Patchlog"
                className="h-4 mx-3 object-contain"
              />

              <div className="h-px bg-[#b8afa3] flex-1" />
            </div>
          </div>

          <h1 className="text-5xl font-serif font-medium text-[#3d3935] leading-none mb-4">
            Discover
          </h1>

          <p className="text-[#4f4942]">
            Explore the world of pedals.
          </p>
        </div>
      </div>
    </main>
  )
}
