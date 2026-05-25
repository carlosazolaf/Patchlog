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
    STATUS FILTER
  */

  const [statusFilter, setStatusFilter] =
    useState('all')

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
    COUNTS
  */

  const [counts, setCounts] = useState({
    all: 0,
    have: 0,
    had: 0,
    want: 0
  })

  /*
    LOAD
  */

  useEffect(() => {
    fetchCollection()
  }, [
    statusFilter,
    brandFilter,
    modelFilter,
    typeFilter,
    subtypeFilter
  ])

  /*
    FETCH
  */

  async function fetchCollection() {
    let userQuery = supabase
      .from('user_pedals')
      .select('*')

    const { data: allStatuses } =
      await supabase
        .from('user_pedals')
        .select('*')

    const haveCount =
      allStatuses?.filter(
        (p) => p.status === 'have'
      ).length || 0

    const hadCount =
      allStatuses?.filter(
        (p) => p.status === 'had'
      ).length || 0

    const wantCount =
      allStatuses?.filter(
        (p) => p.status === 'want'
      ).length || 0

    setCounts({
      all: allStatuses?.length || 0,
      have: haveCount,
      had: hadCount,
      want: wantCount
    })

    if (statusFilter !== 'all') {
      userQuery = userQuery.eq(
        'status',
        statusFilter
      )
    }

    const { data: userPedalsData } =
      await userQuery

    if (
      !userPedalsData ||
      userPedalsData.length === 0
    ) {
      setPedals([])
      return
    }

    const pedalIds = userPedalsData.map(
      (p) => p.pedal_id
    )

    let pedalsQuery = supabase
      .from('pedals')
      .select('*')
      .in('pedal_id', pedalIds)
      .order('name', {
        ascending: true
      })

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

    const { data: typesData } =
      await supabase
        .from('type')
        .select('*')

    const { data: subtypesData } =
      await supabase
        .from('subtype')
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
          userPedalsData.find(
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

    /*
      FILTERED BRANDS
    */

    const collectionBrands = [
      ...new Map(
        enriched.map((p) => [
          p.brand_id,
          {
            brand_id: p.brand_id,
            brand: p.brand_name
          }
        ])
      ).values()
    ].sort((a, b) =>
      (a.brand || '').localeCompare(
        b.brand || ''
      )
    )

    /*
      FILTERED TYPES
    */

    const collectionTypes = [
      ...new Map(
        enriched.map((p) => [
          p.type_id,
          {
            type_id: p.type_id,
            type: p.type_name
          }
        ])
      ).values()
    ].sort((a, b) =>
      (a.type || '').localeCompare(
        b.type || ''
      )
    )

    /*
      FILTERED SUBTYPES
    */

    const collectionSubtypes = [
      ...new Map(
        enriched.map((p) => [
          p.subtype_id,
          {
            subtype_id: p.subtype_id,
            subtype: p.subtype_name
          }
        ])
      ).values()
    ].sort((a, b) =>
      (a.subtype || '').localeCompare(
        b.subtype || ''
      )
    )

    setBrands(collectionBrands)
    setTypes(collectionTypes)
    setSubtypes(collectionSubtypes)
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
    <main className="min-h-screen bg-[#f5f1ea] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md px-6 py-4">
        {/* HEADER */}
        <div className="mb-8">
          <img
            src="https://wwdbhjmslvspllmzoflo.supabase.co/storage/v1/object/public/logo/patchlogo.png"
            alt="Patchlog"
            className="w-full object-contain mb-5"
          />

          <h1 className="text-3xl font-serif font-medium text-[#2f2a24] leading-none mb-2">
            Collection
          </h1>

          <p className="text-[#4a443d] text-base">
            Your personal pedal archive.
          </p>
        </div>

        {/* STATUS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            'all',
            'have',
            'had',
            'want'
          ].map((status) => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(status)
              }
              className={`cursor-pointer px-4 py-3 rounded-full text-sm capitalize transition ${
                statusFilter === status
                  ? 'bg-[#2f2a24] text-[#f8f5ef]'
                  : 'bg-[#faf7f2] border border-[#d0c7bb]'
              }`}
            >
              {status} (
              {
                counts[
                  status as keyof typeof counts
                ]
              }
              )
            </button>
          ))}
        </div>

        {/* FILTERS */}
        {/* resto idéntico al discover */}
