const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

type AuthScope = 'customer' | 'admin';

function currentScope(): AuthScope {
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'customer';
}

function scopedKey(name: 'token' | 'user', scope: AuthScope = currentScope()) {
  return `pawnest_${scope}_${name}`;
}

function isAdminRole(role?: string) {
  return ['admin', 'staff', 'groomer', 'reception'].includes(role || '');
}

export type ApiUser = {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'admin' | 'staff' | 'groomer' | 'reception';
  store_id?: number | null;
  membership_tier?: 'general' | 'vip';
  membership_points?: number;
  vip_expires_at?: string | null;
  status?: 'active' | 'inactive';
  annual_spending?: number;
  annualSpending?: number;
  yearly_spending?: number;
  yearlySpending?: number;
  total_spending?: number;
  totalSpending?: number;
  annual_consumption?: number;
  annualConsumption?: number;
};

export type ServiceItem = {
  id: number;
  name: string;
  category: 'grooming' | 'boarding' | 'daycare' | 'addon';
  price: number;
  duration_minutes: number;
  description: string;
  image_url?: string;
  badge?: string;
  status?: 'active' | 'inactive';
  target_pet_type?: 'all' | 'dog' | 'cat';
};

export type ActivityItem = {
  id: number;
  title: string;
  category?: string;
  summary?: string;
  description: string;
  start_date?: string | null;
  end_date?: string | null;
  image_url?: string;
  cta_label?: string;
  cta_link?: string;
  is_banner?: number;
  sort_order?: number;
  status?: 'active' | 'inactive';
};

export type StoreItem = {
  id: number;
  name: string;
  area?: string;
  address?: string;
  phone?: string;
  open_time?: string;
  close_time?: string;
  image_url?: string;
  description?: string;
  status?: 'active' | 'inactive';
  dog_room_capacity?: number;
  cat_room_capacity?: number;
  daycare_capacity?: number;
};

export type ReviewItem = {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  service_name?: string;
  photo_url?: string;
  reply?: string;
  replied_at?: string;
  status?: 'visible' | 'hidden';
  created_at?: string;
};

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

export type ContactMessageItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: 'new' | 'read' | 'closed';
  created_at?: string;
  updated_at?: string;
};

export type PetItem = {
  id: number;
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed?: string;
  gender?: string;
  age?: number | null;
  weight?: number | null;
  note?: string;
  photo_url?: string;
};

export type PublicHomeData = {
  activities: ActivityItem[];
  services: ServiceItem[];
  stores: StoreItem[];
  reviews: ReviewItem[];
};

export type UpdateProfilePayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export function getStoredUser(scope: AuthScope = currentScope()): ApiUser | null {
  try {
    const scopedRaw = sessionStorage.getItem(scopedKey('user', scope));

    if (scopedRaw) {
      return JSON.parse(scopedRaw);
    }

    if (scope === 'admin') {
      const adminRaw = sessionStorage.getItem('admin_user');

      if (adminRaw) {
        return JSON.parse(adminRaw);
      }
    }

    if (scope === 'customer') {
      const customerRaw = sessionStorage.getItem('customer_user');

      if (customerRaw) {
        return JSON.parse(customerRaw);
      }
    }

    const genericRaw = sessionStorage.getItem('user');

    if (genericRaw) {
      const genericUser = JSON.parse(genericRaw);

      if (scope === 'admin' && isAdminRole(genericUser.role)) {
        return genericUser;
      }

      if (scope === 'customer' && genericUser.role === 'customer') {
        return genericUser;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getToken(scope: AuthScope = currentScope()) {
  if (scope === 'admin') {
    const adminToken =
      sessionStorage.getItem('admin_token') ||
      sessionStorage.getItem(scopedKey('token', 'admin'));

    const adminUser = getStoredUser('admin');

    if (adminToken && isAdminRole(adminUser?.role)) {
      return adminToken;
    }

    return '';
  }

  const customerToken =
    sessionStorage.getItem('customer_token') ||
    sessionStorage.getItem(scopedKey('token', 'customer'));

  const customerUser = getStoredUser('customer');

  if (customerToken && customerUser?.role === 'customer') {
    return customerToken;
  }

  return '';
}

export function saveAuth(
  token: string,
  user: ApiUser,
  scope: AuthScope = currentScope(),
) {
  const resolvedScope: AuthScope = isAdminRole(user.role) ? 'admin' : 'customer';

  sessionStorage.setItem(scopedKey('token', resolvedScope), token);
  sessionStorage.setItem(scopedKey('user', resolvedScope), JSON.stringify(user));

  if (resolvedScope === 'admin') {
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(user));

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));

    sessionStorage.removeItem('customer_token');
    sessionStorage.removeItem('customer_user');
    sessionStorage.removeItem(scopedKey('token', 'customer'));
    sessionStorage.removeItem(scopedKey('user', 'customer'));
  }

  if (resolvedScope === 'customer') {
    sessionStorage.setItem('customer_token', token);
    sessionStorage.setItem('customer_user', JSON.stringify(user));

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));

    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem(scopedKey('token', 'admin'));
    sessionStorage.removeItem(scopedKey('user', 'admin'));
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');

  window.dispatchEvent(new Event('pawnest-auth-change'));
}

export function clearAuth(scope: AuthScope = currentScope()) {
  sessionStorage.removeItem(scopedKey('token', scope));
  sessionStorage.removeItem(scopedKey('user', scope));

  if (scope === 'admin') {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
  }

  if (scope === 'customer') {
    sessionStorage.removeItem('customer_token');
    sessionStorage.removeItem('customer_user');
  }

  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  window.dispatchEvent(new Event('pawnest-auth-change'));
}

function getScopeByPath(path: string): AuthScope {
  if (path.startsWith('/admin')) return 'admin';
  if (window.location.pathname.startsWith('/admin')) return 'admin';
  return 'customer';
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const scope = getScopeByPath(path);
  const token = getToken(scope);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || `API 錯誤：${response.status}`);
  }

  return data as T;
}

export async function loginApi(account: string, password: string) {
  return apiFetch<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      account,
      username: account,
      email: account,
      password,
    }),
  });
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return apiFetch<{ token: string; user: ApiUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      username: payload.email,
      password: payload.password,
      phone: payload.phone || '',
    }),
  });
}

export const publicApi = {
  home: () => apiFetch<PublicHomeData>('/public/home'),

  services: () =>
    apiFetch<{ services: ServiceItem[] }>('/public/services'),

  activities: () =>
    apiFetch<{ activities: ActivityItem[] }>('/public/activities'),

  activity: (id: number) =>
    apiFetch<{ activity: ActivityItem }>(`/public/activities/${id}`),

  stores: () =>
    apiFetch<{ stores: StoreItem[] }>('/public/stores'),

  reviews: () =>
    apiFetch<{ reviews: ReviewItem[] }>('/public/reviews'),

  contact: (payload: ContactPayload) =>
    apiFetch<{ id: number; message: string }>('/public/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const petApi = {
  listMine: () => apiFetch<{ pets: PetItem[] }>('/pets/my'),

  create: (payload: Partial<PetItem>) =>
    apiFetch<{ id: number; message: string }>('/pets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<PetItem>) =>
    apiFetch<{ message: string }>(`/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id: number) =>
    apiFetch<{ message: string }>(`/pets/${id}`, {
      method: 'DELETE',
    }),
};

export const reviewApi = {
  create: (payload: {
    booking_id?: number | null;
    service_id?: number | null;
    rating: number;
    comment: string;
    photo_url?: string | null;
  }) =>
    apiFetch<{ id: number; message: string }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const adminApi = {
  members: () => apiFetch<{ members: ApiUser[] }>('/admin/members'),

  createMember: (payload: Partial<ApiUser> & { password?: string }) =>
    apiFetch<{ id: number; message: string }>('/admin/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMember: (id: number, payload: Partial<ApiUser> & { password?: string }) =>
    apiFetch<{ message: string }>(`/admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMember: (id: number) =>
    apiFetch<{ message: string }>(`/admin/members/${id}`, {
      method: 'DELETE',
    }),

  activities: () =>
    apiFetch<{ activities: ActivityItem[] }>('/admin/activities'),

  createActivity: (payload: Partial<ActivityItem>) =>
    apiFetch<{ id: number; message: string }>('/admin/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateActivity: (id: number, payload: Partial<ActivityItem>) =>
    apiFetch<{ message: string }>(`/admin/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteActivity: (id: number) =>
    apiFetch<{ message: string }>(`/admin/activities/${id}`, {
      method: 'DELETE',
    }),

  services: () =>
    apiFetch<{ services: ServiceItem[] }>('/admin/services'),

  createService: (payload: Partial<ServiceItem>) =>
    apiFetch<{ id: number; message: string }>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateService: (id: number, payload: Partial<ServiceItem>) =>
    apiFetch<{ message: string }>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteService: (id: number) =>
    apiFetch<{ message: string }>(`/admin/services/${id}`, {
      method: 'DELETE',
    }),

  stores: () =>
    apiFetch<{ stores: StoreItem[] }>('/admin/stores'),

  createStore: (payload: Partial<StoreItem>) =>
    apiFetch<{
      id: number;
      message: string;
      staff_account?: { username: string; password: string };
    }>('/admin/stores', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStore: (id: number, payload: Partial<StoreItem>) =>
    apiFetch<{ message: string }>(`/admin/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteStore: (id: number) =>
    apiFetch<{ message: string }>(`/admin/stores/${id}`, {
      method: 'DELETE',
    }),

  reviews: () =>
    apiFetch<{ reviews: ReviewItem[] }>('/admin/reviews'),

  replyReview: (
    id: number,
    payload: { reply?: string; status?: 'visible' | 'hidden' },
  ) =>
    apiFetch<{ message: string }>(`/admin/reviews/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

    deleteReview: (id: number) =>
      apiFetch<{ message: string }>(`/admin/reviews/${id}`, {
        method: 'DELETE',
      }),

  contactMessages: (status?: 'new' | 'read' | 'closed') =>
    apiFetch<{ messages: ContactMessageItem[] }>(
      `/admin/contact-messages${status ? `?status=${status}` : ''}`,
    ),

  updateContactMessageStatus: (
    id: number,
    status: 'new' | 'read' | 'closed',
  ) =>
    apiFetch<{ message: string }>(`/admin/contact-messages/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const authApi = {
  updateProfile: (payload: UpdateProfilePayload) =>
    apiFetch<{ message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};