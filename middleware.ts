import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/bank-dashboard')) {
    const session = request.cookies.get('plenty_session')
    if (!session) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard', '/admin/dashboard/:path*', '/admin/bank-dashboard', '/admin/bank-dashboard/:path*']
}
