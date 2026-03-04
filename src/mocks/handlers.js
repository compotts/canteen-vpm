import { http, HttpResponse } from 'msw';

const today = () => new Date().toISOString().slice(0, 10);

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.login && body.password && body.password.length >= 1) {
      return HttpResponse.json({ accessToken: 'mock-token-' + Date.now() });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.get('/api/menu/today', () => {
    return HttpResponse.json({
      date: today(),
      items: [
        { id: 1, name: 'Суп гороховый', price: 2.5, step: 0.5 },
        { id: 2, name: 'Котлета с гарниром', price: 3.0, step: 1 },
        { id: 3, name: 'Салат овощной', price: 1.2, step: 0.5 },
        { id: 4, name: 'Компот', price: 0.8, step: 1 },
        { id: 5, name: 'Чай', price: 0.5, step: 1 },
      ],
    });
  }),

  http.post('/api/order', async ({ request }) => {
    const body = await request.json();
    if (body.date && Array.isArray(body.items)) {
      return HttpResponse.json({
        orderId: 'ORD-' + Date.now(),
        status: 'ok',
      });
    }
    return new HttpResponse(null, { status: 400 });
  }),
];
