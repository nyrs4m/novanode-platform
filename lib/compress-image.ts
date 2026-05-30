export async function compressImage(
  file: File,
  maxWidth = 800,
  maxSizeKB = 200,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Try WebP first, fallback to JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression failed')); return }

          // If still too large, compress more aggressively
          if (blob.size > maxSizeKB * 1024 && quality > 0.4) {
            canvas.toBlob(
              (b2) => { if (b2) resolve(b2); else reject(new Error('Failed')) },
              'image/webp', quality - 0.2
            )
          } else {
            resolve(blob)
          }
        },
        'image/webp', quality
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

export async function uploadMenuImage(
  file: File,
  restaurantId: string,
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>
): Promise<string> {
  const compressed = await compressImage(file)
  const fileName = `${restaurantId}/${Date.now()}.webp`

  const { error } = await supabase.storage
    .from('menu-images')
    .upload(fileName, compressed, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}