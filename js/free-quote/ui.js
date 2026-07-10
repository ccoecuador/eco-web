export function createQuoteUI() {
  const refs = {
    quoteForm: document.getElementById('quoteForm'),
    serviceSelect: document.getElementById('service'),
    propertyTypeSelect: document.getElementById('property_type'),
    propertyProblemsInput: document.getElementById('property_problems'),
    problemsContainer: document.getElementById('problemsContainer'),
    problemsStatus: document.getElementById('problemsStatus'),
    formNotice: document.getElementById('formNotice'),
    quoteSuccess: document.getElementById('quoteSuccess'),
    successRequestModal: document.getElementById('successRequestModal'),
    successModalNewRequestBtn: document.getElementById('successModalNewRequestBtn'),
    successModalCallBtn: document.getElementById('successModalCallBtn'),
    submitButton: document.getElementById('quoteSubmit'),
    serverUnavailableModal: document.getElementById('serverUnavailableModal'),
    serverUnavailableModalTitle: document.getElementById('serverUnavailableModalLabel'),
    serverUnavailableModalMessage: document.getElementById('serverUnavailableModalMessage'),
    serverModalTryAgainBtn: document.getElementById('serverModalTryAgainBtn'),
    serverModalCallBtn: document.getElementById('serverModalCallBtn'),
  };

  function populateServices(services) {
    const options = ['<option value="">Select a service...</option>']
      .concat(services.map((service) => {
        const val = typeof service === 'object' ? service.value : service;
        const lbl = typeof service === 'object' ? service.label : service;
        return `<option value="${val}">${lbl}</option>`;
      }));
    refs.serviceSelect.innerHTML = options.join('');
  }

  function renderProblemPlaceholder(message) {
    refs.problemsContainer.className = 'problem-grid is-empty';
    refs.problemsContainer.innerHTML = `<div class="problem-placeholder">${message}</div>`;
    refs.propertyProblemsInput.value = '';
  }

  function renderLoadingProblems(message = 'Fetching possible problems...') {
    refs.problemsContainer.className = 'problem-grid is-empty';
    refs.problemsContainer.innerHTML = `
      <div class="problem-loading" aria-live="polite">
        <span class="problem-spinner" aria-hidden="true"></span>
        <span>${message}</span>
      </div>
    `;
    refs.propertyProblemsInput.value = '';
  }

  function renderProblems(problems) {
    if (!Array.isArray(problems) || !problems.length) {
      renderProblemPlaceholder('No predefined problems are available for this service right now.');
      return;
    }

    refs.problemsContainer.className = 'problem-grid';
    refs.problemsContainer.innerHTML = problems
      .map((problem, index) => {
        const resolvedProblem = typeof problem === 'string' ? { name: problem } : problem;
        const label = String(resolvedProblem?.name || `Problem ${index + 1}`).trim();
        const safeValue = label.replace(/"/g, '&quot;');
        const checkedAttr = resolvedProblem?.checked ? ' checked' : '';
        const disabledAttr = resolvedProblem?.disabled ? ' disabled' : '';
        const lockedAttr = resolvedProblem?.locked ? ' data-locked="true"' : '';

        return `
          <label class="problem-option">
            <input type="checkbox" name="property_problems" value="${safeValue}"${checkedAttr}${disabledAttr}${lockedAttr}>
            <span>${label}</span>
          </label>
        `;
      })
      .join('');
  }

  function setProblemsStatus(message) {
    refs.problemsStatus.textContent = message;
  }

  function showNotice(message, type = 'error') {
    refs.formNotice.textContent = message;
    refs.formNotice.className = `form-alert show ${type}`;
  }

  function hideNotice() {
    refs.formNotice.textContent = '';
    refs.formNotice.className = 'form-alert';
  }

  function setSubmittingState(isSubmitting) {
    refs.submitButton.disabled = isSubmitting;
    refs.submitButton.textContent = isSubmitting ? 'Sending...' : 'Get My Free Quote →';
  }

  function showServerUnavailableModal(
    message = 'We couldn’t send your request at the moment.',
    title = 'We’re temporarily unavailable'
  ) {
    if (refs.serverUnavailableModalTitle) {
      refs.serverUnavailableModalTitle.textContent = title;
    }

    if (refs.serverUnavailableModalMessage) {
      refs.serverUnavailableModalMessage.textContent = message;
    }

    if (refs.serverUnavailableModal && window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getOrCreateInstance(refs.serverUnavailableModal);
      modal.show();
      return;
    }
  }

  function hideServerUnavailableModal() {
    if (refs.serverUnavailableModal && window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getOrCreateInstance(refs.serverUnavailableModal);
      modal.hide();
    }
  }

  function showSuccess() {
    if (refs.successRequestModal && window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getOrCreateInstance(refs.successRequestModal);
      modal.show();
      return;
    }

    refs.quoteSuccess?.classList.add('visible');
  }

  function hideSuccess() {
    if (refs.successRequestModal && window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(refs.successRequestModal);
      modal?.hide();
    }

    refs.quoteSuccess?.classList.remove('visible');
  }

  function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorBox = document.getElementById(`${fieldName}-error`);

    if (field) {
      field.classList.toggle('input-error', Boolean(message));
    }

    if (errorBox) {
      errorBox.textContent = message || '';
    }
  }

  function clearFieldError(fieldName) {
    showFieldError(fieldName, '');
  }

  return {
    refs,
    populateServices,
    renderProblemPlaceholder,
    renderLoadingProblems,
    renderProblems,
    setProblemsStatus,
    showNotice,
    hideNotice,
    setSubmittingState,
    showServerUnavailableModal,
    hideServerUnavailableModal,
    showSuccess,
    hideSuccess,
    showFieldError,
    clearFieldError,
  };
}
