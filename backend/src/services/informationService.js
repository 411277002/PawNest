import {
  listActiveActivities,
  listActiveServices,
  listActiveStores,
  listVisibleReviews,
  findActiveActivityById,
} from '../repositories/informationRepository.js';

function formatDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function createFallbackSummary(description) {
  const text = normalizeText(description);

  if (!text) return '';

  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function formatActivity(row) {
  const summary = normalizeText(row.summary);

  return {
    ...row,
    summary: summary || createFallbackSummary(row.description),
    description: normalizeText(row.description),
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
  };
}

export async function getPublicServicesService() {
  return listActiveServices();
}

export async function getPublicActivitiesService() {
  const rows = await listActiveActivities();

  return rows.map(formatActivity);
}

export async function getPublicActivityService(id) {
  const row = await findActiveActivityById(id);

  return row ? formatActivity(row) : null;
}

export async function getPublicStoresService() {
  return listActiveStores();
}

export async function getPublicReviewsService() {
  return listVisibleReviews({ limit: 50 });
}

export async function getHomeInformationService() {
  const [activities, services, stores, reviews] = await Promise.all([
    listActiveActivities(),
    listActiveServices({ limit: 3 }),
    listActiveStores({ limit: 3 }),
    listVisibleReviews({ limit: 3 }),
  ]);

  return {
    activities: activities.map(formatActivity),
    services,
    stores,
    reviews,
  };
}