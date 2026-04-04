export function GET() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#0F172A" />
      <path d="M18 21h16c6.075 0 11 4.925 11 11s-4.925 11-11 11H29v9H18V21Zm11 15h4.25c2.071 0 3.75-1.679 3.75-3.75S35.321 29.5 33.25 29.5H29v6.5Z" fill="#F8FAFC" />
    </svg>
  `.trim()

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}