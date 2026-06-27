const BLOCKED_WORDS = new Set([
  'asdf', 'qwerty', 'test', 'testing', 'tester', 'prueba', 'pruebas',
  'xxxx', 'xxxxx', 'abc', 'abcd', 'lorem', 'ipsum', 'unknown', 'none',
  'null', 'n/a', 'na', 'basura',
]);

export function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizePhone(value) {
  const raw = String(value ?? '').trim();
  const hasLeadingPlus = raw.startsWith('+');
  const digitsOnly = raw.replace(/\D/g, '');

  return `${hasLeadingPlus ? '+' : ''}${digitsOnly}`;
}

function containsLetter(value) {
  return /[A-Za-zÀ-ÿ]/.test(value);
}

function containsBlockedContent(value) {
  const compactValue = value.toLowerCase().replace(/\s+/g, '');
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const tokens = normalized ? normalized.split(/\s+/) : [];

  if (/([a-z0-9])\1{3,}/i.test(compactValue)) {
    return true;
  }

  if (BLOCKED_WORDS.has(compactValue)) {
    return true;
  }

  return tokens.some((token) => BLOCKED_WORDS.has(token));
}

function isPhoneValid(rawValue) {
  const raw = String(rawValue ?? '').trim();
  const cleaned = normalizePhone(raw);
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (!raw || /\s/.test(raw)) {
    return false;
  }

  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return false;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return false;
  }

  return !['123456789', '1234567890', '0000000000'].includes(digitsOnly);
}

export function attachNormalization(fieldIds) {
  fieldIds.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) {
      return;
    }

    field.addEventListener('blur', () => {
      field.value = fieldId === 'phone'
        ? normalizePhone(field.value)
        : normalizeText(field.value);
    });
  });
}

export function createQuoteValidator({ formSelector, getProblemValue, onSubmit }) {
  if (!window.JustValidate) {
    throw new Error('JustValidate is not available on the page.');
  }

  const validator = new window.JustValidate(formSelector, {
    errorFieldCssClass: 'input-error',
    errorLabelCssClass: 'field-error-text',
    focusInvalidField: true,
    validateBeforeSubmitting: true,
    lockForm: true,
  });

  const nameRules = (label) => ([
    { rule: 'required', errorMessage: `${label} is required.` },
    { rule: 'minLength', value: 2, errorMessage: `${label} must contain between 2 and 100 characters.` },
    { rule: 'maxLength', value: 100, errorMessage: `${label} must contain between 2 and 100 characters.` },
    {
      validator: (value) => /^[A-Za-zÀ-ÿ0-9\s]+$/.test(normalizeText(value)),
      errorMessage: `${label} can only contain letters, numbers, and spaces.`,
    },
    {
      validator: (value) => !containsBlockedContent(normalizeText(value)),
      errorMessage: `${label} contains placeholder or obviously invalid text.`,
    },
  ]);

  const configFor = (fieldName) => ({
    errorsContainer: `#${fieldName}-error`,
  });

  validator
    .addField('#firstname', nameRules('First name'), configFor('firstname'))
    .addField('#lastname', nameRules('Last name'), configFor('lastname'))
    .addField('#email', [
      { rule: 'required', errorMessage: 'Email is required.' },
      { rule: 'email', errorMessage: 'Please enter a valid email address.' },
      { rule: 'maxLength', value: 254, errorMessage: 'Email must contain at most 254 characters.' },
      {
        validator: (value) => !containsBlockedContent((normalizeText(value).split('@')[0] || '')),
        errorMessage: 'Email contains placeholder or obviously invalid text.',
      },
    ], configFor('email'))
    .addField('#phone', [
      { rule: 'required', errorMessage: 'Phone number is required.' },
      {
        validator: (value) => isPhoneValid(value),
        errorMessage: 'Use a valid phone number like +13055551234, with no spaces.',
      },
    ], configFor('phone'))
    .addField('#service', [
      { rule: 'required', errorMessage: 'Please select a service.' },
      {
        validator: (value) => containsLetter(normalizeText(value)),
        errorMessage: 'The selected service is not valid.',
      },
    ], configFor('service'))
    .addField('#property_type', [
      {
        validator: (value) => {
          const normalized = normalizeText(value);
          return !normalized || (normalized.length >= 2 && normalized.length <= 100);
        },
        errorMessage: 'Please select a valid property type.',
      },
    ], configFor('property_type'))
    .addField('#property_problems', [
      {
        validator: () => Boolean(getProblemValue()),
        errorMessage: 'Please select at least one problem.',
      },
      {
        validator: () => {
          const problemValue = getProblemValue();
          return problemValue.length >= 5 && problemValue.length <= 500;
        },
        errorMessage: 'Please select at least one valid problem.',
      },
    ], configFor('property_problems'))
    .addField('#problem_description', [
      { rule: 'maxLength', value: 500, errorMessage: 'Description must contain at most 500 characters.' },
      {
        validator: (value) => {
          const normalized = normalizeText(value);
          return !normalized || normalized.length >= 5;
        },
        errorMessage: 'If provided, description must contain at least 5 characters.',
      },
      {
        validator: (value) => {
          const normalized = normalizeText(value);
          return !normalized || /^[A-Za-zÀ-ÿ0-9\s.,;:()\-/#&]+$/.test(normalized);
        },
        errorMessage: 'Description can only contain letters, numbers, spaces, and basic punctuation.',
      },
      {
        validator: (value) => {
          const normalized = normalizeText(value);
          return !normalized || containsLetter(normalized);
        },
        errorMessage: 'Description must include at least one letter.',
      },
      {
        validator: (value) => {
          const normalized = normalizeText(value);
          return !normalized || !containsBlockedContent(normalized);
        },
        errorMessage: 'Description looks like placeholder or obviously invalid text.',
      },
    ], configFor('problem_description'));

  validator.onSuccess((event) => {
    event.preventDefault();
    onSubmit(event);
  });

  return validator;
}
