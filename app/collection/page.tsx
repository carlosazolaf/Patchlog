'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import LoadingTabs from '@/components/LoadingTabs'

export default function CollectionPage() {
  const [pedals, setPedals] = useState<any[]>([])

  const [brands, setBrands] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [subtypes, setSubtypes] = useState<any[]>([])

  /* Filtros */
  const [statusFilter, setStatusFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [subtypeFilter, setSubtypeFilter] = useState('all')

  const [isLoaded, setIsLoaded] = useState(false)
  const [counts, setCounts] = useState({ all: 0, have: 0, had: 0, want: 0 })

  /* 1. Cargar filtros desde sessionStorage (Solo Cliente) */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = sessionStorage.getItem('collection_statusFilter')
      const savedBrand = sessionStorage.getItem('collection_brandFilter')
      const savedModel = sessionStorage.getItem('collection_modelFilter')
      const savedType = sessionStorage.getItem('collection_typeFilter')
      const savedSubtype = sessionStorage.getItem('collection_subtypeFilter')

      if (savedStatus) setStatusFilter(savedStatus)
      if (savedBrand) setBrandFilter(savedBrand)
      if (savedModel) setModelFilter(savedModel)
      if (savedType) setTypeFilter(savedType)
      if (savedSubtype) setSubtypeFilter(savedSubtype)

      setIsLoaded(true)
    }
  }, [])

  /* 2. Función de carga de colección memorizada */
  const fetchCollection = useCallback(async (currStatus: string, currBrand: string, currModel: string, currType: string, currSubtype: string) => {
    let userQuery = supabase.from('user_pedals').select('*')
    const { data: allStatuses } = await supabase.from('user_pedals').select('*')

    setCounts({
      all: allStatuses?.length || 0,
      have: allStatuses?.filter((p) => p.status === 'have').length || 0,
      had: allStatuses?.filter((p) => p.status === 'had').length || 0,
      want: allStatuses?.filter((p) => p.status === 'want').length || 0
    })

    if (currStatus !== 'all') {
      userQuery = userQuery.eq('status', currStatus)
    }

    const { data: userPedalsData } = await userQuery

    if (!userPedalsData || userPedalsData.length === 0) {
      setPedals([])
      return
    }

    const pedalIds = userPedalsData.map((p) => p.pedal_id)

    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .in('pedal_id', pedalIds)
      .order('name', { ascending: true })

    if (currBrand !== 'all') pedalsQuery = pedalsQuery.eq('brand_id', currBrand)
    if (currModel !== 'all') pedalsQuery = pedalsQuery.eq('pedal_id', currModel)
    if (currType !== 'all') pedalsQuery = pedalsQuery.eq('type_id', currType)
    if (currSubtype !== 'all') pedalsQuery = pedalsQuery.eq('subtype_id', currSubtype)

    const { data: pedalsData } = await pedalsQuery
    const { data: brandsData } = await supabase.from('brand').select('*')
    const { data: typesData } = await supabase.from('type').select('*')
    const { data: subtypesData } = await supabase.from('subtype').select('*')

    const enriched = (pedalsData || []).map((pedal) => {
      const brand = brandsData?.find((b) => Number(b.brand_id) === Number(pedal.brand_id))
      const type = typesData?.find((t) => Number(t.type_id) === Number(pedal.type_id))
      const subtype = subtypesData?.find((s) => Number(s.subtype_id) === Number(pedal.subtype_id))
      const userPedal = userPedalsData.find((u) => Number(u.pedal_id) === Number(pedal.pedal_id))

      return {
        ...pedal,
        brand_name: brand?.brand || '',
        type_name: type?.type || '',
        subtype_name: subtype?.subtype || '',
        status: userPedal?.status || ''
      }
    })

    setPedals(enriched)
    setBrands(brandsData || [])
    setTypes(typesData || [])
    setSubtypes(subtypesData || [])
  }, [])

  /* 3. Ejecución controlada de filtros */
  useEffect(() => {
    if (isLoaded) {
      fetchCollection(statusFilter, brandFilter, modelFilter, typeFilter, subtypeFilter)
      sessionStorage.setItem('collection_statusFilter', statusFilter)
      sessionStorage.setItem('collection_brandFilter', brandFilter)
      sessionStorage.setItem('collection_modelFilter', modelFilter)
      sessionStorage.setItem('collection_typeFilter', typeFilter)
      sessionStorage.setItem('collection_subtypeFilter', subtypeFilter)
    }
  }, [statusFilter, brandFilter, modelFilter, typeFilter, subtypeFilter, isLoaded, fetchCollection])

  /* 4. Scroll Tracking */
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('collection_scroll_pos', window.scrollY.toString())
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* 5. Restaurar Scroll */
  useEffect(() => {
    if (pedals.length > 0 && isLoaded) {
      const savedScroll = sessionStorage.getItem('collection_scroll_pos')
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll, 10))
        }, 50)
      }
    }
  }, [pedals, isLoaded])

  async function removePedal(pedalId: number) {
    await supabase.from('user_pedals').delete().eq('pedal_id', pedalId)
    fetchCollection(statusFilter, brandFilter, modelFilter, typeFilter, subtypeFilter)
  }

  async function moveStatus(pedalId: number, status: string) {
    await supabase.from('user_pedals').update({ status }).eq('pedal_id', pedalId)
    fetchCollection(statusFilter, brandFilter, modelFilter, typeFilter, subtypeFilter)
  }

  const models = useMemo(() => {
    return [...pedals].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [pedals])

  /* Uso de tu componente personalizado LoadingTabs */
  if (!isLoaded) {
    return <LoadingTabs text="Loading collection..." />
  }

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
          <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-2">Collection</h1>
          <p className="text-[#3a342e] text-base">Your personal pedal archive.</p>
        </div>

        {/* STATUS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'have', 'had', 'want'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`cursor-pointer px-4 py-3 rounded-full text-sm font-medium capitalize transition ${statusFilter === status ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
            >
              {status} ({counts[status as keyof typeof counts]})
            </button>
          ))}
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
              <option key={brand.brand_id} value={brand.brand_id}>{brand.brand}</option>
            ))}
          </select>

          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-4 text-[#26211d]"
          >
            <option value="all">All Models</option>
            {models.map((pedal) => (
              <option key={pedal.pedal_id} value={pedal.pedal_id}>{pedal.name}</option>
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
              <option key={type.type_id} value={type.type_id}>{type.type}</option>
            ))}
          </select>

          <select
            value={subtypeFilter}
            onChange={(e) => setSubtypeFilter(e.target.value)}
            className="cursor-pointer bg-[#faf7f2] border border-[#c8beb1] rounded-2xl px-4 py-4 text-[#26211d]"
          >
            <option value="all">All Subtypes</option>
            {subtypes.map((subtype) => (
              <option key={subtype.subtype_id} value={subtype.subtype_id}>{subtype.subtype}</option>
            ))}
          </select>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">
          {pedals.map((pedal) => {
            const imageUrl = `https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/pedal_images/${pedal.image_path}`
            return (
              <Link href={`/pedal/${pedal.pedal_id}`} key={pedal.pedal_id}>
                <div className="bg-[#faf7f2] rounded-[2rem] p-4 border border-[#ebe6df]">
                  <div className="bg-[#f3efe8] rounded-[1.5rem] h-44 flex items-center justify-center mb-4">
                    <img src={imageUrl} alt={pedal.name} className="h-32 object-contain" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#5b544c] mb-2">{pedal.brand_name}</p>
                  <h2 className="text-2xl font-serif font-medium text-[#26211d] leading-none mb-3">{pedal.name}</h2>
                  <div className="mb-4 space-y-1">
                    <p className="text-xs text-[#3a342e]">{pedal.type_name}</p>
                    <p className="text-xs text-[#5b544c]">{pedal.subtype_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={() => moveStatus(pedal.pedal_id, 'have')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${pedal.status === 'have' ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
                    >Have</button>
                    <button
                      onClick={() => moveStatus(pedal.pedal_id, 'had')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${pedal.status === 'had' ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
                    >Had</button>
                    <button
                      onClick={() => moveStatus(pedal.pedal_id, 'want')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${pedal.status === 'want' ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
                    >Want</button>
                    <button
                      onClick={() => removePedal(pedal.pedal_id)}
                      className="cursor-pointer text-sm font-medium px-3 py-2 rounded-full bg-red-100 text-red-700"
                    >Remove</button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link href="/discover" className="cursor-pointer text-[#5b544c]">Discover</Link>
            <Link href="/collection" className="cursor-pointer text-[#26211d] font-medium">Collection</Link>
          </div>
        </div>
        <div className="h-24" />
      </div>
    </main>
  )
}
