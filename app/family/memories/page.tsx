import { permanentRedirect } from 'next/navigation'

// /family/memories is now merged into /family/photos
export default function MemoriesPage() {
  permanentRedirect('/family/photos')
}
