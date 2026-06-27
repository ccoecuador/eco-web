import { fetchProblemsByService, fetchServices, submitQuoteRequest } from './api.js';
import { attachNormalization, createQuoteValidator, normalizePhone, normalizeText } from './validation.js';
import { createQuoteUI } from './ui.js';

const ui = createQuoteUI();
const { refs } = ui;
let validator;
const OTHERS_SERVICE_NAME = 'Others';
const OTHERS_LOCKED_PROBLEM = 'Not applicable for this type of services';

function normalizeQuotePageUrl() {
  const { pathname, search, hash } = window.location;

  if (pathname.endsWith('/free-quote/index.html')) {
    const cleanPath = pathname.replace(/index\.html$/, '');
    window.history.replaceState({}, '', `${cleanPath}${search}${hash}`);
  }
}

function getSelectedProblems() {
  return Array.from(
    refs.quoteForm.querySelectorAll('input[name="property_problems"]:checked')
  )
    .map((checkbox) => normalizeText(checkbox.value))
    .filter(Boolean);
}

function syncProblemValue() {
  const joinedProblems = getSelectedProblems().join(';');
  refs.propertyProblemsInput.value = joinedProblems;
  return joinedProblems;
}

function isSubmitReady() {
  const requiredValues = [
    normalizeText(document.getElementById('firstname')?.value),
    normalizeText(document.getElementById('lastname')?.value),
    normalizeText(document.getElementById('email')?.value),
    normalizePhone(document.getElementById('phone')?.value),
    normalizeText(refs.serviceSelect?.value),
    syncProblemValue(),
  ];

  return requiredValues.every(Boolean);
}

function updateSubmitButtonState(isSubmitting = false) {
  if (!refs.submitButton) {
    return;
  }

  const shouldDisable = isSubmitting || !isSubmitReady();
  refs.submitButton.disabled = shouldDisable;
  refs.submitButton.classList.toggle('is-disabled', shouldDisable);
}

function resetServiceSelectionFlow() {
  if (refs.serviceSelect) {
    refs.serviceSelect.value = '';
  }

  if (refs.propertyTypeSelect) {
    refs.propertyTypeSelect.value = '';
  }

  refs.propertyProblemsInput.value = '';
  ui.clearFieldError('service');
  ui.clearFieldError('property_type');
  ui.clearFieldError('property_problems');
  ui.hideNotice();
  ui.setProblemsStatus('Select a service to load the available problems.');
  ui.renderProblemPlaceholder('Select a service first to see the available issues.');
  updateSubmitButtonState();

  if (refs.serviceSelect) {
    refs.serviceSelect.focus();
  }
}

function revalidateField(fieldSelector) {
  if (validator && typeof validator.revalidateField === 'function') {
    validator.revalidateField(fieldSelector);
  }
}

function parseErrorPayload(error) {
  if (error instanceof Error && error.message) {
    try {
      return JSON.parse(error.message);
    } catch (_parseError) {
      return null;
    }
  }

  return null;
}

function sanitizeBackendMessage(message) {
  const normalizedMessage = String(message ?? '').trim();

  if (!normalizedMessage) {
    return '';
  }

  return normalizedMessage
    .replace(/\.?\s*(?:Existing\s+)?ID:\s*\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function applyBackendErrors(payload) {
  if (Array.isArray(payload?.missing_fields)) {
    payload.missing_fields.forEach((fieldName) => {
      ui.showFieldError(fieldName, 'This field is required.');
    });
  }

  if (payload?.validation_errors && typeof payload.validation_errors === 'object') {
    Object.entries(payload.validation_errors).forEach(([fieldName, message]) => {
      ui.showFieldError(fieldName, String(message));
    });
  }
}

function buildPayload() {
  return {
    firstname: normalizeText(document.getElementById('firstname').value),
    lastname: normalizeText(document.getElementById('lastname').value),
    email: normalizeText(document.getElementById('email').value).toLowerCase(),
    phone: normalizePhone(document.getElementById('phone').value),
    service: normalizeText(refs.serviceSelect.value),
    property_problems: syncProblemValue(),
    problem_description: normalizeText(document.getElementById('problem_description').value),
    property_type: normalizeText(refs.propertyTypeSelect.value) || 'Not specified',
  };
}

async function initializeServices() {
  const { services, usedFallback, error } = await fetchServices();
  ui.populateServices(services);

  if (usedFallback && error) {
    console.warn('Service loading fallback used:', error);
  }
}

async function handleServiceChange() {
  const serviceName = normalizeText(refs.serviceSelect.value);

  ui.hideSuccess();
  ui.hideNotice();
  ui.clearFieldError('service');
  ui.clearFieldError('property_problems');
  syncProblemValue();

  if (!serviceName) {
    ui.setProblemsStatus('Select a service to load the available problems.');
    ui.renderProblemPlaceholder('Select a service first to see the available issues.');
    revalidateField('#service');
    updateSubmitButtonState();
    return;
  }

  ui.setProblemsStatus('Fetching possible problems...');
  ui.renderLoadingProblems('Fetching possible problems...');

  try {
    const { problems } = await fetchProblemsByService(serviceName);

    if (serviceName === OTHERS_SERVICE_NAME) {
      if (Array.isArray(problems) && problems.length) {
        const lockedProblems = problems.map((problem) => ({
          name: typeof problem === 'string' ? problem : problem.name,
          checked: true,
          disabled: true,
          locked: true,
        }));
        ui.renderProblems(lockedProblems);
        ui.setProblemsStatus('These options are automatically selected for Others service.');
      } else {
        ui.renderProblems([
          {
            name: OTHERS_LOCKED_PROBLEM,
            checked: true,
            disabled: true,
            locked: true,
          },
        ]);
        ui.setProblemsStatus('This option is automatically selected for Others service.');
      }
      return;
    }

    if (Array.isArray(problems) && problems.length) {
      ui.renderProblems(problems);
      ui.setProblemsStatus('Select all the problems that apply to your request.');
    } else {
      ui.setProblemsStatus('No predefined problems are available for this service right now.');
      ui.renderProblemPlaceholder('No predefined problems are available for this service right now.');
    }
  } catch (error) {
    const popupMessage = 'The server is currently unavailable. Please contact us directly.';
    ui.setProblemsStatus('We could not load the available problems right now.');
    ui.renderProblemPlaceholder('We could not load the available problems right now.');
    ui.showServerUnavailableModal(popupMessage);
    console.warn('Problem loading failed:', error);
  } finally {
    syncProblemValue();
    revalidateField('#property_problems');
    updateSubmitButtonState();
  }
}

async function handleValidSubmit(event) {
  event.preventDefault();

  ui.hideSuccess();
  ui.hideNotice();
  ui.setSubmittingState(true);

  const payload = buildPayload();

  try {
    const response = await submitQuoteRequest(payload);

    refs.quoteForm.reset();
    refs.propertyTypeSelect.value = '';
    ui.renderProblemPlaceholder('Select a service first to see the available issues.');
    ui.setProblemsStatus('Select a service to load the available problems.');
    updateSubmitButtonState();
    ui.showSuccess();
    console.info('Quote request sent successfully:', response);
  } catch (error) {
    const errorPayload = parseErrorPayload(error);
    const fallbackMessage = 'We could not send your request right now. Please try again in a moment.';
    const isConflictError = String(errorPayload?.category || '').toUpperCase() === 'CONFLICT';
    const backendMessage = isConflictError
      ? 'This email has already been registered. Our team will contact you soon.'
      : sanitizeBackendMessage(errorPayload?.message || errorPayload?.error) || fallbackMessage;

    if (errorPayload) {
      applyBackendErrors(errorPayload);
    }

    ui.showServerUnavailableModal(backendMessage, 'There was a problem submitting the form');
    console.error('Quote request failed:', error);
  } finally {
    ui.setSubmittingState(false);
    updateSubmitButtonState();
  }
}

function initializeQuoteForm() {
  normalizeQuotePageUrl();

  if (!refs.quoteForm) {
    console.warn('Quote form not found on this page.');
    return;
  }

  attachNormalization(['firstname', 'lastname', 'email', 'phone', 'problem_description']);

  validator = createQuoteValidator({
    formSelector: '#quoteForm',
    getProblemValue: syncProblemValue,
    onSubmit: handleValidSubmit,
  });

  refs.serviceSelect.addEventListener('change', handleServiceChange);
  refs.propertyTypeSelect.addEventListener('change', () => {
    revalidateField('#property_type');
    updateSubmitButtonState();
  });

  refs.serverModalTryAgainBtn?.addEventListener('click', () => {
    ui.hideServerUnavailableModal();
    resetServiceSelectionFlow();
  });

  refs.serverModalCallBtn?.addEventListener('click', () => {
    ui.hideServerUnavailableModal();
    resetServiceSelectionFlow();
  });

  refs.successModalNewRequestBtn?.addEventListener('click', () => {
    ui.hideSuccess();
    document.getElementById('firstname')?.focus();
  });

  refs.successModalCallBtn?.addEventListener('click', () => {
    ui.hideSuccess();
  });

  refs.quoteForm.addEventListener('input', () => {
    updateSubmitButtonState();
  });

  refs.quoteForm.addEventListener('change', (event) => {
    if (event.target && event.target.name === 'property_problems') {
      syncProblemValue();
      ui.clearFieldError('property_problems');
      revalidateField('#property_problems');
    }

    updateSubmitButtonState();
  });

  ui.renderProblemPlaceholder('Select a service first to see the available issues.');
  ui.setProblemsStatus('Select a service to load the available problems.');
  updateSubmitButtonState();
  initializeServices();
}

initializeQuoteForm();
