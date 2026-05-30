'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/database.types'
import { compressImage } from '@/lib/compress-image'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, Check, ChevronLeft, Loader2, ImagePlus,
  UtensilsCrossed, Tag, Star, Zap
} from 'lucide-react'

type Restaurant = Tables<'restaurants'>
type Category = Tables<'categories'>
type MenuItem = Tables<'menu_items'>

interface MenuManagerProps {
  restaurant: Restaurant
  initialCategories: Category[]
  initialItems: MenuItem[]
}

type View = 'list' | 'add-item' | 'edit-item' | 'add-category'

export default function MenuManager({
  restaurant,
  initialCategories,
  initialItems,
}: MenuManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [view, setView] = useState<View>('list')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [form, setForm] = useState({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_starter: false,
  })
  const [catName, setCatName] = useState({ en: '', fr: '' })

  function resetForm() {
    setForm({
      name_en: '', name_fr: '', description_en: '',
      description_fr: '', price: '', category_id: '',
      image_url: '', is_available: true, is_starter: false,
    })
    setEditingItem(null)
  }

  function openAddItem() {
    resetForm()
    setView('add-item')
  }

  function openEditItem(item: MenuItem) {
    setForm({
      name_en: item.name_en,
      name_fr: item.name_fr ?? '',
      description_en: item.description_en ?? '',
      description_fr: item.description_fr ?? '',
      price: String(item.price),
      category_id: item.category_id ?? '',
      image_url: item.image_url,
      is_available: item.is_available ?? true,
      is_starter: item.is_starter ?? false,
    })
    setEditingItem(item)
    setView('edit-item')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const compressed = await compressImage(file)
      const fileName = `${restaurant.id}/${Date.now()}.webp`
      const { error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, compressed, { contentType: 'image/webp' })
      if (error) throw error
      const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
    } catch (err) {
      alert('Image upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploadingImage(false)
    }
  }

  async function saveItem() {
    if (!form.name_en.trim()) { alert('Item name is required'); return }
    if (!form.price || isNaN(Number(form.price))) { alert('Valid price is required'); return }
    if (!form.image_url) { alert('Please upload an image'); return }

    setSaving(true)
    try {
      if (editingItem) {
        const { data, error } = await supabase
          .from('menu_items')
          .update({
            name_en: form.name_en.trim(),
            name_fr: form.name_fr.trim() || null,
            description_en: form.description_en.trim() || null,
            description_fr: form.description_fr.trim() || null,
            price: Number(form.price),
            category_id: form.category_id || null,
            image_url: form.image_url,
            is_available: form.is_available,
            is_starter: form.is_starter,
          })
          .eq('id', editingItem.id)
          .select().single()
        if (error) throw error
        if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
      } else {
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            restaurant_id: restaurant.id,
            name_en: form.name_en.trim(),
            name_fr: form.name_fr.trim() || null,
            description_en: form.description_en.trim() || null,
            description_fr: form.description_fr.trim() || null,
            price: Number(form.price),
            category_id: form.category_id || null,
            image_url: form.image_url,
            is_available: form.is_available,
            is_starter: form.is_starter,
          })
          .select().single()
        if (error) throw error
        if (data) setItems(prev => [data, ...prev])
      }
      resetForm()
      setView('list')
    } catch (err) {
      alert('Failed to save item. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert('Failed to delete item.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleAvailability(item: MenuItem) {
    const newVal = !item.is_available
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newVal } : i))
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: newVal })
      .eq('id', item.id)
    if (error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !newVal } : i))
      alert('Failed to update availability.')
    }
  }

  async function saveCategory() {
    if (!catName.en.trim()) { alert('Category name is required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurant.id,
          name_en: catName.en.trim(),
          name_fr: catName.fr.trim() || null,
          sort_order: categories.length,
        })
        .select().single()
      if (error) throw error
      if (data) setCategories(prev => [...prev, data])
      setCatName({ en: '', fr: '' })
      setView('list')
    } catch (err) {
      alert('Failed to save category.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Items in it will become uncategorized.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { alert('Failed to delete category.'); return }
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const filteredItems = selectedCategory
    ? items.filter(i => i.category_id === selectedCategory)
    : items

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'var(--cream-06)',
    border: '1px solid var(--cream-15)',
    borderRadius: 12, color: 'var(--cream)',
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: 'var(--cream-35)',
    fontSize: 11, fontWeight: 700,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8,
  }

  // ── ITEM FORM ──
  if (view === 'add-item' || view === 'edit-item') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
        <header className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon" onClick={() => { resetForm(); setView('list') }}>
              <ChevronLeft size={18} />
            </button>
            <div>
              <p className="t-title" style={{ fontSize: 15 }}>
                {view === 'edit-item' ? 'Edit Item' : 'New Menu Item'}
              </p>
              <p className="t-eyebrow">{restaurant.name}</p>
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 20px', fontSize: 13 }}
            onClick={saveItem}
            disabled={saving}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save Item</>}
          </button>
        </header>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>

          {/* Image Upload */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Food Photo *</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', height: 200, borderRadius: 16,
                background: form.image_url ? 'transparent' : 'var(--cream-06)',
                border: `2px dashed ${form.image_url ? 'var(--gold-dim)' : 'var(--cream-15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              {uploadingImage ? (
                <div style={{ textAlign: 'center' }}>
                  <Loader2 size={28} color="var(--gold-glow)" style={{ margin: '0 auto 8px', display: 'block', animation: 'spin 1s linear infinite' }} />
                  <p className="t-caption">Compressing & uploading...</p>
                </div>
              ) : form.image_url ? (
                <>
                  <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0'}
                  >
                    <p className="t-caption" style={{ color: '#fff' }}>Click to change</p>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <ImagePlus size={28} color="var(--cream-35)" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p className="t-caption">Click to upload photo</p>
                  <p className="t-caption" style={{ marginTop: 4, fontSize: 10 }}>Auto-compressed to WebP</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Name (English) *</label>
              <input style={inputStyle} placeholder="e.g. Jollof Rice" value={form.name_en}
                onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Name (French)</label>
              <input style={inputStyle} placeholder="e.g. Riz Jollof" value={form.name_fr}
                onChange={e => setForm(f => ({ ...f, name_fr: e.target.value }))} />
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Description (English)</label>
              <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' } as React.CSSProperties}
                placeholder="Brief description..."
                value={form.description_en}
                onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Description (French)</label>
              <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' } as React.CSSProperties}
                placeholder="Description courte..."
                value={form.description_fr}
                onChange={e => setForm(f => ({ ...f, description_fr: e.target.value }))} />
            </div>
          </div>

          {/* Price + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Price ({restaurant.currency}) *</label>
              <input style={inputStyle} type="number" placeholder="0.00" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <button
              onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
              style={{
                flex: 1, padding: '12px 16px',
                background: form.is_available ? 'rgba(16,185,129,0.1)' : 'var(--cream-06)',
                border: `1px solid ${form.is_available ? 'rgba(16,185,129,0.3)' : 'var(--cream-15)'}`,
                borderRadius: 12, cursor: 'pointer',
                color: form.is_available ? '#34d399' : 'var(--cream-35)',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {form.is_available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {form.is_available ? 'Available' : 'Unavailable'}
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, is_starter: !f.is_starter }))}
              style={{
                flex: 1, padding: '12px 16px',
                background: form.is_starter ? 'rgba(245,158,11,0.1)' : 'var(--cream-06)',
                border: `1px solid ${form.is_starter ? 'var(--gold-dim)' : 'var(--cream-15)'}`,
                borderRadius: 12, cursor: 'pointer',
                color: form.is_starter ? 'var(--gold-glow)' : 'var(--cream-35)',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <Zap size={16} />
              {form.is_starter ? 'Is a Starter' : 'Not a Starter'}
            </button>
          </div>

          <button className="btn-primary" onClick={saveItem} disabled={saving}>
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
              : <><Check size={18} /> {view === 'edit-item' ? 'Update Item' : 'Add to Menu'}</>
            }
          </button>
        </div>
      </div>
    )
  }

  // ── CATEGORY FORM ──
  if (view === 'add-category') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
        <header className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon" onClick={() => setView('list')}><ChevronLeft size={18} /></button>
            <div>
              <p className="t-title" style={{ fontSize: 15 }}>New Category</p>
              <p className="t-eyebrow">{restaurant.name}</p>
            </div>
          </div>
        </header>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '32px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Category Name (English) *</label>
            <input style={inputStyle} placeholder="e.g. Main Dishes" value={catName.en}
              onChange={e => setCatName(c => ({ ...c, en: e.target.value }))} autoFocus />
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>Category Name (French)</label>
            <input style={inputStyle} placeholder="e.g. Plats Principaux" value={catName.fr}
              onChange={e => setCatName(c => ({ ...c, fr: e.target.value }))} />
          </div>
          <button className="btn-primary" onClick={saveCategory} disabled={saving}>
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Check size={18} /> Save Category</>}
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN LIST ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
      <header className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => router.push(`/dashboard/${restaurant.slug}`)}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="t-title" style={{ fontSize: 15 }}>Menu Management</p>
            <p className="t-eyebrow">{restaurant.name} · {items.length} items</p>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }}
          onClick={openAddItem}
        >
          <Plus size={16} /> Add Item
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* Categories */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="t-eyebrow">Categories</p>
            <button
              onClick={() => setView('add-category')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cream-06)', border: '1px solid var(--cream-15)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--cream-35)', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
            >
              <Plus size={13} /> New Category
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`pill ${selectedCategory === null ? 'active' : ''}`}
            >
              All ({items.length})
            </button>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`pill ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.name_en} ({items.filter(i => i.category_id === cat.id).length})
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cream-35)', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  title="Delete category"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <UtensilsCrossed size={40} color="var(--cream-35)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
            <p className="t-body" style={{ marginBottom: 20 }}>No items yet. Add your first dish!</p>
            <button className="btn-primary" style={{ width: 'auto', margin: '0 auto', display: 'flex' }} onClick={openAddItem}>
              <Plus size={16} /> Add First Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredItems.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--surface)',
                border: `1px solid ${item.is_available ? 'rgba(217,119,6,0.12)' : 'rgba(253,251,247,0.06)'}`,
                borderRadius: 16, padding: 14,
                boxShadow: 'var(--shadow-card)',
                opacity: item.is_available ? 1 : 0.6,
                transition: 'all 0.2s',
              }}>
                {/* Image */}
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-3)' }}>
                  <img src={item.image_url} alt={item.name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <p className="t-title" style={{ fontSize: 14 }}>{item.name_en}</p>
                    {item.is_starter && <Zap size={12} color="var(--gold-glow)" />}
                    {!item.is_available && <span style={{ fontSize: 9, fontWeight: 800, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: 50, letterSpacing: 0.5 }}>UNAVAILABLE</span>}
                  </div>
                  <p className="t-caption" style={{ marginBottom: 2 }}>
                    {categories.find(c => c.id === item.category_id)?.name_en ?? 'Uncategorized'}
                  </p>
                  <p className="t-price-sm" style={{ fontSize: 14 }}>
                    {restaurant.currency} {Number(item.price).toFixed(2)}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleAvailability(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_available ? '#34d399' : 'var(--cream-35)', padding: 6, display: 'flex', transition: 'all 0.2s' }}
                    title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                  >
                    {item.is_available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    onClick={() => openEditItem(item)}
                    style={{ background: 'var(--cream-06)', border: '1px solid var(--cream-15)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--cream-35)', display: 'flex', transition: 'all 0.2s' }}
                    title="Edit item"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deletingId === item.id}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#f87171', display: 'flex', transition: 'all 0.2s' }}
                    title="Delete item"
                  >
                    {deletingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}