import DonatePage from '@/components/DonatePage'

export default function DonateSlug({ params }: { params: { slug: string } }) {
  return <DonatePage preferredSlug={params.slug} />
}
