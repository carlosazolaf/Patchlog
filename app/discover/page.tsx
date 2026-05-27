'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import LoadingTabs from '@/components/LoadingTabs'

export default function DiscoverPage() {
  const [pedals, setPedals] = useState<any[]>([])
  const [userPedals, setUserPedals] = useState<any[]>([])

  const [brands, setBrands] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [subtypes, setSubtypes] = useState<any[]>([])

  /* Filtros */
  const [brandFilter, setBrandFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [subtypeFilter, setSubtypeFilter] = useState('all')

  const [isLoaded, setIsLoaded] = useState(false)

  /* 1. Cargar filtros iniciales desde sessionStorage (Solo Cliente) */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBrand = sessionStorage.getItem('discover_brandFilter')
      const savedModel = sessionStorage.getItem('discover_modelFilter')
      const savedType = sessionStorage.getItem('discover_typeFilter')
      const savedSubtype = sessionStorage.getItem('discover_subtypeFilter')

      if (savedBrand) setBrandFilter(savedBrand)
      if (savedModel) setModelFilter(savedModel)
      if (savedType) setTypeFilter(savedType)
      if (savedSubtype) setSubtypeFilter(savedSubtype)
      
      setIsLoaded(true)
    }
  }, [])

  /* 2. Función de carga de datos memorizada para evitar bucles infinitos */
  const fetchData = useCallback(async (currentBrand: string, currentModel: string, currentType: string, currentSubtype: string) => {
    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .order('name', { ascending: true })
      .limit(300)

    if (currentBrand !== 'all') pedalsQuery = pedalsQuery.eq('brand_id', currentBrand)
    if (currentModel !== 'all') pedalsQuery = pedalsQuery.eq('pedal_id', currentModel)
    if (currentType !== 'all') pedalsQuery = pedalsQuery.eq('type_id', currentType)
    if (currentSubtype !== 'all') pedalsQuery = pedalsQuery.eq('subtype_id', currentSubtype)

    const { data: pedalsData } = await pedalsQuery
    const { data: brandsData } = await supabase.from('brand').select('*').order('brand', { ascending: true })
    const { data: typesData } = await supabase.from('type').select('*').order('type', { ascending: true })
    const { data: subtypesData } = await supabase.from('subtype').select('*').order('subtype', { ascending: true })
    const { data: userPedalsData } = await supabase.from('user_pedals').select('*')

    const enriched = (pedalsData || []).map((pedal) => {
      const brand = brandsData?.find((b) => Number(b.brand_id) === Number(pedal.brand_id))
      const type = typesData?.find((t) => Number(t.type_id) === Number(pedal.type_id))
      const subtype = subtypesData?.find((s) => Number(s.subtype_id) === Number(pedal.subtype_id))
      const userPedal = userPedalsData?.find((u) => Number(u.pedal_id) === Number(pedal.pedal_id))

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
    setBrands(brandsData || [])
    setTypes(typesData || [])
    setSubtypes(subtypesData || [])
  }, [])

  /* 3. Trigger de peticiones y persistencia cuando los filtros cambian */
  useEffect(() => {
    if (isLoaded) {
      fetchData(brandFilter, modelFilter, typeFilter, subtypeFilter)
      sessionStorage.setItem('discover_brandFilter', brandFilter)
      sessionStorage.setItem('discover_modelFilter', modelFilter)
      sessionStorage.setItem('discover_typeFilter', typeFilter)
      sessionStorage.setItem('discover_subtypeFilter', subtypeFilter)
    }
  }, [brandFilter, modelFilter, typeFilter, subtypeFilter, isLoaded, fetchData])

  /* 4. Captura de Scroll */
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('discover_scroll_pos', window.scrollY.toString())
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* 5. Restauración de Scroll */
  useEffect(() => {
    if (pedals.length > 0 && isLoaded) {
      const savedScroll = sessionStorage.getItem('discover_scroll_pos')
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll, 10))
        }, 50)
      }
    }
  }, [pedals, isLoaded])

  const handleStatusChange = async (pedalId: number, status: string) => {
    const existing = userPedals.find((p) => Number(p.pedal_id) === Number(pedalId))
    if (existing) {
      await supabase.from('user_pedals').update({ status }).eq('pedal_id', pedalId)
    } else {
      await supabase.from('user_pedals').insert({ pedal_id: pedalId, status })
    }
    fetchData(brandFilter, modelFilter, typeFilter, subtypeFilter)
  }

  const models = useMemo(() => {
    return [...pedals].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [pedals])

  /* Uso de tu componente personalizado LoadingTabs */
  if (!isLoaded) {
    return <LoadingTabs text="Loading discover..." />
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
          <h1 className="text-3xl font-serif font-medium text-[#26211d] leading-none mb-2">Discover</h1>
          <p className="text-[#3a342e] text-base">Explore the world of pedals.</p>
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
                      onClick={() => handleStatusChange(pedal.pedal_id, 'have')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${pedal.status === 'have' ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
                    >Have</button>
                    <button
                      onClick={() => handleStatusChange(pedal.pedal_id, 'had')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${pedal.status === 'had' ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
                    >Had</button>
                    <button
                      onClick={() => handleStatusChange(pedal.pedal_id, 'want')}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 rounded-full ${pedal.status === 'want' ? 'bg-[#26211d] text-[#f8f5ef]' : 'bg-[#faf7f2] border border-[#c8beb1]'}`}
                    >Want</button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* NAV */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f1ea]/95 backdrop-blur border-t border-[#e8e1d8]">
          <div className="max-w-md mx-auto flex justify-around py-4 text-sm">
            <Link href="/discover" className="cursor-pointer text-[#26211d] font-medium">Discover</Link>
            <Link href="/collection" className="cursor-pointer text-[#5b544c]">Collection</Link>
          </div>
        </div>
        <div className="h-24" />
      </div>
    </main>
  )
}
