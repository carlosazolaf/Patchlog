'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DiscoverPage() {
  const [pedals, setPedals] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [subtypes, setSubtypes] =
    useState<any[]>([])

  const [userPedals, setUserPedals] =
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
    INITIAL LOAD
  */

  useEffect(() => {
    fetchInitialData()
  }, [])

  /*
    PEDALS RELOAD
  */

  useEffect(() => {
    fetchPedals()
  }, [
    brandFilter,
    modelFilter,
    typeFilter,
    subtypeFilter
  ])

  /*
    LOAD STATIC TABLES
  */

  async function fetchInitialData() {
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

    const { data: userPedalsData } =
      await supabase
        .from('user_pedals')
        .select('*')

    setBrands(brandsData || [])
    setTypes(typesData || [])
    setSubtypes(subtypesData || [])
    setUserPedals(userPedalsData || [])
  }

  /*
    LOAD PEDALS
  */

  async function fetchPedals() {
    let query = supabase
      .from('pedals')
      .select('*')
      .order('name', {
        ascending: true
      })
      .limit(300)

    /*
      BRAND
    */

    if (brandFilter !== 'all') {
      query = query.eq(
        'brand_id',
        brandFilter
      )
    }

    /*
      MODEL
    */

    if (modelFilter !== 'all') {
      query = query.eq(
        'pedal_id',
        modelFilter
      )
    }

    /*
      TYPE
    */

    if (typeFilter !== 'all') {
      query = query.eq(
        'type_id',
        typeFilter
      )
    }

    /*
      SUBTYPE
    */

    if (subtypeFilter !== 'all') {
      query = query.eq(
        'subtype_id',
        subtypeFilter
      )
    }

    const { data: pedalsData } =
      await query

    /*
      ENRICH
    */

    const enriched = (pedalsData || []).map(
      (pedal) => {
        const brand = brands.find(
          (b) =>
            Number(b.brand_id) ===
            Number(pedal.brand_id)
        )

        const type = types.find(
          (t) =>
            Number(t.type_id) ===
            Number(pedal.type_id)
        )

        const subtype = subtypes.find(
          (s) =>
            Number(s.subtype_id) ===
            Number(pedal.subtype_id)
        )

        return {
          ...pedal,

          brand_name:
            brand?.brand || '',

          type_name:
            type?.type || '',

          subtype_name:
            subtype?.subtype || ''
        }
      }
    )

    setPedals(enriched)
  }

  /*
    STATUS
  */

  function getStatus(pedalId: number) {
    return userPedals.find(
      (p) =>
        Number(p.pedal_id) ===
        Number(pedalId)
    )?.status
  }

  /*
    BUTTONS
  */

 async function setStatus(
  pedalId: number,
  status: string
) {
  console.log(
    'SET STATUS',
    pedalId,
    status
  )

  const existing = userPedals.find(
    (p) =>
      Number(p.pedal_id) ===
      Number(pedalId)
  )

  /*
    UPDATE
  */

  if (existing) {
    const { data, error } =
      await supabase
        .from('user_pedals')
        .update({ status })
        .eq('pedal_id', pedalId)
        .select()

    console.log('UPDATE DATA', data)
    console.log('UPDATE ERROR', error)
  }

  /*
    INSERT
  */

  else {
    const { data, error } =
      await supabase
        .from('user_pedals')
        .insert({
          pedal_id: pedalId,
          status
        })
        .select()

    console.log('INSERT DATA', data)
    console.log('INSERT ERROR', error)
  }

  /*
    LOCAL UI UPDATE
  */

  setUserPedals((prev) => {
    const filtered = prev.filter(
      (p) =>
        Number(p.pedal_id) !==
        Number(pedalId)
    )

    return [
      ...filtered,
      {
        pedal_id: pedalId,
        status
      }
    ]
  })
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
            Discover
          </h1>

          <p className="text-[#5e564c]">
            Explore pedals and build your archive.
          </p>
        </div>

        {/* FILTERS ROW 1 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* BRAND */}
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value)

              setModelFilter('all')
              setTypeFilter('all')
              setSubtypeFilter('all')
            }}
            className="cursor-pointer bg-white border border-[#d6cec2] rounded-2xl px-4 py-4 text-[#171717]"
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

          {/* MODEL */}
          <select
            value={modelFilter}
            onChange={(e) =>
              setModelFilter(e.target.value)
            }
            className="bg-white border border-[#d6cec2] rounded-2xl px-4 py-4 text-[#171717]"
          >
            <option value="all">
              All Models
            </option>

            {models.map((pedal) => (
              <option
                key={pedal.pedal_id}
                value={pedal.pedal_id}
              >
                {pedal.name}
              </option>
            ))}
          </select>
        </div>

        {/* FILTERS ROW 2 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* TYPE */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setSubtypeFilter('all')
            }}
            className="bg-white border border-[#d6cec2] rounded-2xl px-4 py-4 text-[#171717]"
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
            className="bg-white border border-[#d6cec2] rounded-2xl px-4 py-4 text-[#171717]"
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

            const status = getStatus(
              pedal.pedal_id
            )

            return (
              <Link
  href={`/pedal/${pedal.slug}`}
  key={pedal.pedal_id}
>
                className="bg-[#fcfbf8] rounded-[2rem] p-4 border border-[#ebe6df]"
              >
                {/* IMAGE */}
                <div className="bg-[#f3efe8] rounded-[1.5rem] h-44 flex items-center justify-center mb-4">
                  <img
                    src={imageUrl}
                    alt={pedal.name}
                    className="h-32 object-contain"
                  />
                </Link>

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

                {/* BUTTONS */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setStatus(
                        pedal.pedal_id,
                        'have'
                      )
                    }
                    className={`cursor-pointer text-xs px-3 py-2 rounded-full transition ${
                      status === 'have'
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#d6cec2]'
                    }`}
                  >
                    Have
                  </button>

                  <button
                    onClick={() =>
                      setStatus(
                        pedal.pedal_id,
                        'had'
                      )
                    }
                    className={`cursor-pointer text-xs px-3 py-2 rounded-full transition ${
                      status === 'had'
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#d6cec2]'
                    }`}
                  >
                    Had
                  </button>

                  <button
                    onClick={() =>
                      setStatus(
                        pedal.pedal_id,
                        'want'
                      )
                    }
                    className={`cursor-pointer text-xs px-3 py-2 rounded-full transition ${
                      status === 'want'
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#d6cec2]'
                    }`}
                  >
                    Want
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
              className="text-black font-medium"
              cursor-pointer
            >
              Discover
            </Link>

            <Link
              href="/collection"
              className="text-[#8c8479]"
              cursor-pointer
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
