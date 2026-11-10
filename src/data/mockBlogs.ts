export type BlogCategory = 'Architecture' | 'Technology'

export interface BlogPostPreview {
  id: string
  title: string
  excerpt: string
  category: BlogCategory
  date: string
  readTime: string
  isPaid: boolean
  priceLabel: string
  imageUrl: string
  imageAlt: string
}

export const MOCK_BLOGS: readonly BlogPostPreview[] = [
  {
    id: 'quiet-computing-cognitive-silence',
    title: 'Quiet Computing & The Architecture of Cognitive Silence',
    excerpt:
      'An inquiry into computational environments that honor human attention spans, examining spatial interfaces and deliberate software restraint.',
    category: 'Architecture',
    date: 'Oct 24, 2026',
    readTime: '8 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 10,000',
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Minimalist concrete and timber pavilion beside calm water in morning mist',
  },
  {
    id: 'tactile-typography-modern-os',
    title: 'Tactile Typography in Modern Operating Systems',
    excerpt:
      'Exploring physical typesetting traditions to revitalize the clinical sterility of contemporary desktop typography and high-density displays.',
    category: 'Technology',
    date: 'Nov 02, 2026',
    readTime: '5 min read',
    isPaid: false,
    priceLabel: 'Free',
    imageUrl:
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Traditional movable metal letterpress type blocks arranged on a wooden workbench',
  },
  {
    id: 'distributed-topology-outlast-frenzy',
    title: 'Distributed Topology: Engineering Built to Outlast Frenzy',
    excerpt:
      'Lessons drawn from resilient decentralized infrastructure operating across bandwidth-constrained networks in East Africa.',
    category: 'Architecture',
    date: 'Nov 14, 2026',
    readTime: '12 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 5,000',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Illuminated server rack cabling inside a dark data center',
  },
  {
    id: 'anatomy-of-resilient-distributed-systems',
    title: 'The Anatomy of Resilient Distributed Systems',
    excerpt:
      'Why modern hyper-scaled topologies frequently collapse under synchronous cascading locks, and how adopting asynchronous partition boundaries creates calm.',
    category: 'Architecture',
    date: 'Nov 21, 2026',
    readTime: '10 min read',
    isPaid: false,
    priceLabel: 'Free',
    imageUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Sunlit brutalist concrete interior with timber ceiling beams and staircase',
  },
  {
    id: 'memory-allocations-bare-metal',
    title: 'Memory Allocations in Bare-Metal Embedded Runtimes',
    excerpt:
      'Deterministic arena allocators, zero-copy ring buffers, and the craft of writing predictable systems software that runs for decades without rebooting.',
    category: 'Technology',
    date: 'Nov 29, 2026',
    readTime: '9 min read',
    isPaid: true,
    priceLabel: 'Paid · UGX 8,000',
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Macro photograph of precision circuit board traces and microcontrollers',
  },
  {
    id: 'nordic-architectural-restraint-ui',
    title: 'Nordic Architectural Restraint in Spatial Interfaces',
    excerpt:
      'How structural honesty, natural material hierarchies, and negative space from 20th-century civic architecture inform calmer digital workspaces.',
    category: 'Architecture',
    date: 'Dec 05, 2026',
    readTime: '7 min read',
    isPaid: false,
    priceLabel: 'Free',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Clean geometric facade of a modern architectural structure',
  },
] as const

