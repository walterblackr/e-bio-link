// middleware.ts
// Protege las rutas del panel de administración y onboarding de clientes

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas de admin que NO requieren autenticación
  const publicAdminPaths = ['/admin/login'];

  // Si está en una ruta pública de admin, permitir
  if (publicAdminPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Si está en /admin/*, verificar sesión de admin
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession) {
      // No hay sesión, redirigir a login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Hay sesión, permitir acceso
    return NextResponse.next();
  }

  // Si está en /onboarding, verificar sesión de cliente activo
  if (pathname.startsWith('/onboarding')) {
    const clientSession = request.cookies.get('client_session');

    if (!clientSession) {
      // No hay sesión, redirigir a registro
      return NextResponse.redirect(new URL('/register', request.url));
    }

    try {
      // Parsear sesión para verificar status
      const session = JSON.parse(clientSession.value);

      if (session.status !== 'active') {
        // Cliente no activo (pago pendiente), redirigir a success para polling
        return NextResponse.redirect(new URL(`/success?client_id=${session.id}`, request.url));
      }

      // Cliente activo, permitir acceso
      return NextResponse.next();
    } catch (error) {
      // Error al parsear sesión, eliminar cookie y redirigir
      const response = NextResponse.redirect(new URL('/register', request.url));
      response.cookies.delete('client_session');
      return response;
    }
  }

  // Otras rutas, permitir
  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/onboarding/:path*',
  ],
};
