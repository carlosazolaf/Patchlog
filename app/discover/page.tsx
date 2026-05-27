'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DiscoverPage() {
  const router = useRouter()
  const restoredRef = useRef(false)

  const [pedals, setPedals] = useState<any[]>([])
  const [userPedals, setUserPedals] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [subtypes, setSubtypes] = useState<any[]>([])

  /*
    FILTERS
  */
  const [brandFilter, setBrandFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [subtypeFilter, setSubtypeFilter] = useState('all')

  /*
    RESTORE SCROLL & FILTERS
  */
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    const savedFilters = sessionStorage.getItem('discover_filters')
    if (savedFilters) {
      try {
        const f = JSON.parse(savedFilters)
        setBrandFilter(f.brand ?? 'all')
        setModelFilter(f.model ?? 'all')
        setTypeFilter(f.type ?? 'all')
        setSubtypeFilter(f.subtype ?? 'all')
      } catch {}
      sessionStorage.removeItem('discover_filters')
    }

    const savedScroll = sessionStorage.getItem('discover_scrollY')
    if (savedScroll) {
      sessionStorage.removeItem('discover_scrollY')
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' })
      }, 80)
    }
  }, [])

  /*
    LOAD
  */
  useEffect(() => {
    fetchData()
  }, [brandFilter, modelFilter, typeFilter, subtypeFilter])

  /*
    FETCH
  */
  async function fetchData() {
    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .order('name', { ascending: true })
      .limit(300)

    if (brandFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq('brand_id', brandFilter)
    }
    if (modelFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq('pedal_id', modelFilter)
    }
    if (typeFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq('type_id', typeFilter)
    }
    if (subtypeFilter !== 'all') {
      pedalsQuery = pedalsQuery.eq('subtype_id', subtypeFilter)
    }

    const { data: pedalsData } = await pedalsQuery

    const { data: brandsData } = await supabase
      .from('brand')
      .select('*')
      .order('brand', { ascending: true })

    const { data: typesData } = await supabase
      .from('type')
      .select('*')
      .order('type', { ascending: true })

    const { data: subtypesData } = await supabase
      .from('subtype')
      .select('*')
      .order('subtype', { ascending: true })

    const { data: userPedalsData } = await supabase
      .from('user_pedals')
      .select('*')

    const enriched = (pedalsData || []).map((pedal) => {
      const brand = brandsData?.find(
        (b) => Number(b.brand_id) === Number(pedal.brand_id)
      )
      const type = typesData?.find(
        (t) => Number(t.type_id) === Number(pedal.type_id)
      )
      const subtype = subtypesData?.find(
        (s) => Number(s.subtype_id) === Number(pedal.subtype_id)
      )
      const userPedal = userPedalsData?.find(
        (u) => Number(u.pedal_id) === Number(pedal.pedal_id)
      )

      return {
        ...pedal,
        brand_name: brand?.brand || '',
        type_name: type?.type || '',
        subtype_name: subtype?.subtype || '',
        status: userPedal?.status || ''
      }
    })

    setPedals(enriched)
    setUserPedals(userPedalsData || [])

    const filteredTypes = [
      ...new Map(
        enriched.map((p) => [p.type_id, { type_id: p.type_id, type: p.type_name }])
      ).values()
    ]

    const filteredSubtypes = [
      ...new Map(
        enriched.map((p) => [p.subtype_id, { subtype_id: p.subtype_id, subtype: p.subtype_name }])
      ).values()
    ]

    setBrands(brandsData || [])
    setTypes(filteredTypes)
    setSubtypes(filteredSubtypes)
  }

  /*
    STATUS (Con opción de des-seleccionar)
  */
  async function setStatus(pedalId: number, status: string) {
    const existing = userPedals.find(
      (p) => Number(p.pedal_id) === Number(pedalId)
    )

    if (existing) {
      if (existing.status === status) {
        await supabase
          .from('user_pedals')
          .delete()
          .eq('pedal_id', pedalId)
      } else {
        await supabase
          .from('user_pedals')
          .update({ status })
          .eq('pedal_id', pedalId)
      }
    } else {
      await supabase
        .from('user_pedals')
        .insert({ pedal_id: pedalId, status })
    }

    fetchData()
  }

  /*
    MODELS
  */
  const models = useMemo(() => {
    return [...pedals].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    )
  }, [pedals])

  return (
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md px-6 py-4">

        {/* HEADER */}
        <div className="mb-8">
          <img
            src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
            alt="Patchlog"
            className="w-[92%] mx-auto object-contain mb-5"
          />
          <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-2">
            Discover
          </h1>
          <p className="text-[#3a342e] text-base">
            Explore the world of pedals.
          </p>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value)
              setModelFilter('all')
              setTypeFilter('all')
              setSubtypeFilter('all')
            }}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-4 text-[#26211d]"
          >
            <option value="all">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.brand_id} value={brand.brand_id}>
                {brand.brand}
              </option>
            ))}
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-4 text-[#26211d]"
          >
            <option value="all">All Models</option>
            {models.map((pedal) => (
              <option key={pedal.pedal_id} value={pedal.pedal_id}>
                {pedal.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setSubtypeFilter('all')
            }}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-4 text-[#26211d]"
          >
            <option value="all">All Types</option>
            {types.map((type) => (
              <option key={type.type_id} value={type.type_id}>
                {type.type}
              </option>
            ))}
          </select>

          <select
            value={subtypeFilter}
            onChange={(e) => setSubtypeFilter(e.target.value)}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-4 text-[#26211d]"
          >
            <option value="all">All Subtypes</option>
            {subtypes.map((subtype) => (
              <option key={subtype.subtype_id} value={subtype.subtype_id}>
                {subtype.subtype}
              </option>
            ))}
          </select>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">
          {pedals.map((pedal) => {
            const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`

            return (
              <div
                key={pedal.pedal_id}
                className="cursor-pointer"
                onClick={() => {
                  sessionStorage.setItem('discover_scrollY', window.scrollY.toString())
                  sessionStorage.setItem('discover_filters', JSON.stringify({
                    brand: brandFilter,
                    model: modelFilter,
                    type: typeFilter,
                    subtype: subtypeFilter,
                  }))
                  sessionStorage.setItem('pedal_back', 'discover')
                  router.push(`/pedal/${pedal.pedal_id}`)
                }}
              >
                <div className="bg-[#faf7f2] rounded-[2rem] p-4 border border-[#ebe6df]">
                  <div className="bg-[#f3efe8] rounded-[1.5rem] h-44 flex items-center justify-center mb-4">
                    <img
                      src={imageUrl}
                      alt={pedal.name}
                      className="h-32 object-contain"
                    />
                  </div>

                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#5b544c] mb-2">
                    {pedal.brand_name}
                  </p>
                  <h2 className="text-2xl font-serif font-medium text-[#26211d] leading-none mb-3">
                    {pedal.name}
                  </h2>

                  <div className="mb-4 space-y-1">
                    <p className="text-xs text-[#3a342e]">{pedal.type_name}</p>
                    <p className="text-xs text-[#5b544c]">{pedal.subtype_name}</p>
                  </div>

                  <div
                    className="flex flex-wrap gap-2"
                    onClick={(e) => e.preventDefault()}
                  >
                    <button
                      onClick={() => setStatus(pedal.pedal_id, 'have')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${
                        pedal.status === 'have'
                          ? 'bg-[#26211d] text-[#f8f5ef]'
                          : 'bg-[#faf7f2] border border-[#c8beb1]'
                      }`}
                    >
                      Have
                    </button>
                    <button
                      onClick={() => setStatus(pedal.pedal_id, 'had')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${
                        pedal.status === 'had'
                          ? 'bg-[#26211d] text-[#f8f5ef]'
                          : 'bg-[#faf7f2] border border-[#c8beb1]'
                      }`}
                    >
                      Had
                    </button>
                    <button
                      onClick={() => setStatus(pedal.pedal_id, 'want')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${
                        pedal.status === 'want'
                          ? 'bg-[#26211d] text-[#f8f5ef]'
                          : 'bg-[#faf7f2] border border-[#c8beb1]'
                      }`}
                    >
                      Want
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link href="/discover" className="cursor-pointer text-[#26211d] font-medium">
              Discover
            </Link>
            <Link href="/collection" className="cursor-pointer text-[#5b544c]">
              Collection
            </Link>
          </div>
        </div>

        <div className="h-24" />
      </div>
    </main>
  )
}
