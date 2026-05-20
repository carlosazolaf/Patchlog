'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CollectionPage() {
  const [pedals, setPedals] = useState<any[]>([])

  const [brands, setBrands] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [subtypes, setSubtypes] =
    useState<any[]>([])

  /*
    STATUS TAB
  */

  const [statusFilter, setStatusFilter] =
    useState('have')

  /*
    FILTERS
  */

  const [brandFilter, setBrandFilter] =
    useState('all')

  const [typeFilter, setTypeFilter] =
    useState('all')

  const [subtypeFilter, setSubtypeFilter] =
    useState('all')

  /*
    INITIAL LOAD
  */

  useEffect(() => {
    fetchCollection()
  }, [
    statusFilter,
    brandFilter,
    typeFilter,
    subtypeFilter
  ])

  /*
    FETCH COLLECTION
  */

  async function fetchCollection() {
    /*
      USER PEDALS
    */

    const { data: userPedalsData } =
      await supabase
        .from('user_pedals')
        .select('*')
        .eq('status', statusFilter)

    /*
      EMPTY
    */

    if (
      !userPedalsData ||
      userPedalsData.length === 0
    ) {
      setPedals([])
      return
    }

    /*
      IDS
    */

    const pedalIds = userPedalsData.map(
      (p) => p.pedal_id
    )

    /*
      PEDALS
    */

    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .in('pedal_id', pedalIds)
      .order('name', {
        ascending: true
      })

    /*
      BRAND
    */

    if (brandFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'brand_id',
        brandFilter
      )
    }

    /*
      TYPE
    */

    if (typeFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'type_id',
        typeFilter
      )
    }

    /*
      SUBTYPE
    */

    if (subtypeFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq(
        'subtype_id',
        subtypeFilter
      )
    }

    const { data: pedalsData } =
      await pedalsQuery

    /*
      BRANDS
    */

    const { data: brandsData } =
      await supabase
        .from('brand')
        .select('*')
        .order('brand', {
          ascending: true
        })

    /*
      TYPES
    */

    const { data: typesData } =
      await supabase
        .from('type')
        .select('*')
        .order('type', {
          ascending: true
        })

    /*
      SUBTYPES
    */

    const { data: subtypesData } =
      await supabase
        .from('subtype')
        .select('*')
        .order('subtype', {
          ascending: true
        })

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

        const status = userPedalsData.find(
          (u) =>
            Number(u.pedal_id) ===
            Number(pedal.pedal_id)
        )?.status

        return {
          ...pedal,

          brand_name:
            brand?.brand || '',

          type_name:
            type?.type || '',

          subtype_name:
            subtype?.subtype || '',

          status
        }
      }
    )

    setPedals(enriched)

    setBrands(brandsData || [])
    setTypes(typesData || [])
    setSubtypes(subtypesData || [])
  }

  /*
    REMOVE
  */

  async function removePedal(
    pedalId: number
  ) {
    await supabase
      .from('user_pedals')
      .delete()
      .eq('pedal_id', pedalId)

    fetchCollection()
  }

  /*
    MOVE STATUS
  */

  async function moveStatus(
    pedalId: number,
    status: string
  ) {
    await supabase
      .from('user_pedals')
      .update({ status })
      .eq('pedal_id', pedalId)

    fetchCollection()
  }

  /*
    FILTERED TYPES
  */

  const filteredTypes = useMemo(() => {
    const unique = [
      ...new Map(
        pedals.map((p) => [
          p.type_id,
          {
            type_id: p.type_id,
            type: p.type_name
          }
        ])
      ).values()
    ]

    return unique.sort((a, b) =>
      (a.type || '').localeCompare(
        b.type || ''
      )
    )
  }, [pedals])

  /*
    FILTERED SUBTYPES
  */

  const filteredSubtypes = useMemo(() => {
    const unique = [
      ...new Map(
        pedals.map((p) => [
          p.subtype_id,
          {
            subtype_id: p.subtype_id,
            subtype: p.subtype_name
          }
        ])
      ).values()
    ]

    return unique.sort((a, b) =>
      (a.subtype || '').localeCompare(
        b.subtype || ''
      )
    )
  }, [pedals])

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        {/* HEADER */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.35em] uppercase text-[#6f675d] mb-4">
            PATCHLOG
          </p>

          <h1 className="text-5xl font-serif text-[#171717] leading-none mb-4">
            Collection
          </h1>

          <p className="text-[#5e564c]">
            Your personal pedal archive.
          </p>
        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 mb-6">
          {['have', 'had', 'want'].map(
            (status) => (
              <button
                key={status}
                onClick={() =>
                  setStatusFilter(status)
                }
                className={`px-4 py-3 rounded-full text-sm capitalize transition ${
                  statusFilter === status
                    ? 'bg-black text-white'
                    : 'bg-white border border-[#d6cec2]'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* BRAND */}
          <select
            value={brandFilter}
            onChange={(e) =>
              setBrandFilter(e.target.value)
            }
            className="bg-white border border-[#d6cec2] rounded-2xl px-4 py-4"
          >
            <option value="all">
              All Brands
            </option>

            {brands.map((brand) => (
              <option
                key={brand.brand_id}
                value={brand.brand_id}
              >
                {brand.brand}
              </option>
            ))}
          </select>

          {/* TYPE */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setSubtypeFilter('all')
            }}
            className="bg-white border border-[#d6cec2] rounded-2xl px-4 py-4"
          >
            <option value="all">
              All Types
            </option>

            {filteredTypes.map((type) => (
              <option
                key={type.type_id}
                value={type.type_id}
              >
                {type.type}
              </option>
            ))}
          </select>

          {/* SUBTYPE */}
          <select
            value={subtypeFilter}
            onChange={(e) =>
              setSubtypeFilter(e.target.value)
            }
            className="bg-white border border-[#d6cec2] rounded-2xl px-4 py-4"
          >
            <option value="all">
              All Subtypes
            </option>

            {filteredSubtypes.map(
              (subtype) => (
                <option
                  key={subtype.subtype_id}
                  value={
                    subtype.subtype_id
                  }
                >
                  {subtype.subtype}
                </option>
              )
            )}
          </select>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">
          {pedals.map((pedal) => {
            const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

            return (
              <div
                key={pedal.pedal_id}
                className="bg-[#fcfbf8] rounded-[2rem] p-4 border border-[#ebe6df]"
              >
                {/* IMAGE */}
                <div className="bg-[#f3efe8] rounded-[1.5rem] h-44 flex items-center justify-center mb-4">
                  <img
                    src={imageUrl}
                    alt={pedal.name}
                    className="h-32 object-contain"
                  />
                </div>

                {/* BRAND */}
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#8d857a] mb-2">
                  {pedal.brand_name}
                </p>

                {/* NAME */}
                <h2 className="text-2xl font-serif text-[#171717] leading-none mb-3">
                  {pedal.name}
                </h2>

                {/* SPECS */}
                <div className="mb-4 space-y-1">
                  <p className="text-xs text-[#5e564c]">
                    {pedal.type_name}
                  </p>

                  <p className="text-xs text-[#8d857a]">
                    {pedal.subtype_name}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      moveStatus(
                        pedal.pedal_id,
                        'have'
                      )
                    }
                    className={`text-xs px-3 py-2 rounded-full ${
                      pedal.status === 'have'
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#d6cec2]'
                    }`}
                  >
                    Have
                  </button>

                  <button
                    onClick={() =>
                      moveStatus(
                        pedal.pedal_id,
                        'had'
                      )
                    }
                    className={`text-xs px-3 py-2 rounded-full ${
                      pedal.status === 'had'
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#d6cec2]'
                    }`}
                  >
                    Had
                  </button>

                  <button
                    onClick={() =>
                      moveStatus(
                        pedal.pedal_id,
                        'want'
                      )
                    }
                    className={`text-xs px-3 py-2 rounded-full ${
                      pedal.status === 'want'
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#d6cec2]'
                    }`}
                  >
                    Want
                  </button>

                  <button
                    onClick={() =>
                      removePedal(
                        pedal.pedal_id
                      )
                    }
                    className="text-xs px-3 py-2 rounded-full bg-red-100 text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link
              href="/discover"
              className="text-[#8c8479]"
            >
              Discover
            </Link>

            <Link
              href="/collection"
              className="text-black font-medium"
            >
              Collection
            </Link>
          </div>
        </div>

        <div className="h-24" />
      </div>
    </main>
  )
}