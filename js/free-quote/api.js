const LOCAL_SERVICES = [
  { value: 'hvac-installation-and-replacement', label: 'HVAC Installation & Replacement' },
  { value: 'hvac-repair-and-emergency-service', label: 'HVAC Repair & Emergency Service' },
  { value: 'heating-and-heat-pump-services', label: 'Heating & Heat Pump Services' },
  { value: 'preventive-maintenance-plans', label: 'Preventive Maintenance Plans' },
  { value: 'ductwork-ventilation-and-exhaust', label: 'Ductwork, Ventilation & Exhaust Systems' },
  { value: 'indoor-air-quality-solutions', label: 'Indoor Air Quality Solutions' },
  { value: 'commercial-and-industrial-hvac', label: 'Commercial & Industrial HVAC Systems' },
  { value: 'mechanical-construction-and-build-outs', label: 'Mechanical Construction & HVAC Build-Outs' },
  { value: 'comfort-controls-and-energy-efficiency', label: 'Comfort Controls & Energy Efficiency' },
];

const API_BASE_URL = 'https://api-python-flask.eco-techelectricalgroup.com';

function createApiError(payload) {
  return new Error(JSON.stringify(payload));
}

function extractApiMessage(data, fallbackMessage) {
  if (data && typeof data === 'object') {
    const possibleMessage = data.message || data.error;
    if (typeof possibleMessage === 'string' && possibleMessage.trim()) {
      return possibleMessage.trim();
    }
  }

  return fallbackMessage;
}

function parseTextAsJson(text, status) {
  const normalized = String(text ?? '').trim();
  if (!normalized) {
    return {};
  }

  try {
    return JSON.parse(normalized);
  } catch (_error) {
    const isHtmlResponse = /^<!doctype|^<html|^</i.test(normalized);
    throw createApiError({
      category: 'INVALID_RESPONSE',
      status,
      message: isHtmlResponse
        ? 'API endpoint returned HTML instead of JSON.'
        : 'API returned an invalid JSON payload.',
    });
  }
}

async function fetchFirstJson(urls, options = {}) {
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      const rawText = await response.text();
      const data = parseTextAsJson(rawText, response.status);

      if (!response.ok) {
        lastError = createApiError({
          category: data?.category || 'HTTP_ERROR',
          status: response.status,
          message: extractApiMessage(data, `Request failed with status ${response.status}`),
          ...(data && typeof data === 'object' ? data : {}),
        });
        continue;
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to reach the API.');
}

export async function fetchServices() {
  return {
    services: LOCAL_SERVICES,
    usedFallback: false,
    error: null,
  };
}

export async function fetchProblemsByService(serviceName) {
  const normalizedService = String(serviceName ?? '').trim();
  if (!normalizedService) {
    return {
      problems: [],
      error: null,
    };
  }

  const data = await fetchFirstJson([
    `${API_BASE_URL}/clients/problems?service=${encodeURIComponent(normalizedService)}`,
  ]);

  return {
    problems: Array.isArray(data.problems) ? data.problems : [],
    error: null,
  };
}

export async function submitQuoteRequest(payload) {
  return fetchFirstJson(
    [`${API_BASE_URL}/clients/information`],
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}
