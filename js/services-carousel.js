(function () {
  const singleSlideBreakpoint = 1100;
  const desktopGap = 24;

  function initImageReveal() {
    const imageWraps = Array.from(document.querySelectorAll('.gen-img-wrap'));
    if (!imageWraps.length) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      imageWraps.forEach((wrap) => wrap.classList.add('is-visible'));
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          imageObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.35,
      rootMargin: '0px 0px -8% 0px'
    });

    imageWraps.forEach((wrap) => imageObserver.observe(wrap));
  }

  function initCarousel(carouselRoot) {
    const carouselTrack = carouselRoot.querySelector('.gen-carousel-track');
    const carouselItems = carouselTrack ? Array.from(carouselTrack.querySelectorAll('.gen-carousel-item')) : [];
    const carouselDotsWrap = carouselRoot.querySelector('.gen-carousel-dots');
    const prevButton = carouselRoot.querySelector('.gen-carousel-prev');
    const nextButton = carouselRoot.querySelector('.gen-carousel-next');
    let currentIndex = 0;
    let autoSlideId = null;

    if (!carouselTrack || !carouselItems.length) {
      return;
    }

    function getVisibleSlides() {
      if (window.innerWidth <= singleSlideBreakpoint || carouselItems.length <= 2) {
        return 1;
      }
      return 2;
    }

    function getPositionCount() {
      return Math.max(1, carouselItems.length - getVisibleSlides() + 1);
    }

    function getCarouselDots() {
      return carouselDotsWrap ? Array.from(carouselDotsWrap.querySelectorAll('.gen-dot')) : [];
    }

    function updateDots(activePosition) {
      getCarouselDots().forEach((dot, index) => {
        dot.classList.toggle('active', index === activePosition);
      });
    }

    function updateCarousel() {
      const visibleSlides = getVisibleSlides();
      const maxStartIndex = Math.max(0, carouselItems.length - visibleSlides);
      const startIndex = Math.min(currentIndex, maxStartIndex);
      const itemWidth = carouselItems[0].getBoundingClientRect().width;
      const gap = visibleSlides === 1 ? 0 : desktopGap;

      carouselTrack.style.transform = 'translateX(-' + (startIndex * (itemWidth + gap)) + 'px)';
      updateDots(startIndex);
    }

    function goToSlide(index) {
      currentIndex = (index + carouselItems.length) % carouselItems.length;
      updateCarousel();
    }

    function startAutoSlide() {
      clearInterval(autoSlideId);
      autoSlideId = window.setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 5000);
    }

    function stopAutoSlide() {
      clearInterval(autoSlideId);
    }

    function buildDots() {
      if (!carouselDotsWrap) {
        return;
      }

      const dotCount = getPositionCount();
      carouselDotsWrap.innerHTML = '';

      for (let index = 0; index < dotCount; index += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gen-dot';
        dot.setAttribute('aria-label', 'Slide ' + (index + 1));
        dot.addEventListener('click', () => {
          goToSlide(index);
          startAutoSlide();
        });
        carouselDotsWrap.appendChild(dot);
      }
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        startAutoSlide();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        startAutoSlide();
      });
    }

    carouselRoot.addEventListener('mouseenter', stopAutoSlide);
    carouselRoot.addEventListener('mouseleave', startAutoSlide);

    window.addEventListener('resize', () => {
      buildDots();
      updateCarousel();
    });

    buildDots();
    updateCarousel();
    startAutoSlide();
  }

  function initServiceCarousels() {
    const carouselRoots = Array.from(document.querySelectorAll('.gen-carousel-outer'));
    carouselRoots.forEach((root) => initCarousel(root));
  }

  initImageReveal();
  initServiceCarousels();
})();
