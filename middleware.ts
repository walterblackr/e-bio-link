// middleware.ts
// Protege las rutas del panel de administración

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas que NO requieren autenticación
  const publicAdminPaths = ['/admin/login'];

  // Si está en una ruta pública de admin, permitir
  if (publicAdminPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Si está en /admin/*, verificar sesión
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session');

    if (!session) {
      // No hay sesión, redirigir a login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Hay sesión, permitir acceso
    return NextResponse.next();
  }

  // Otras rutas, permitir
  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
