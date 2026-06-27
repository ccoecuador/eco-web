(function(){
  const serviceImageWrap = document.querySelector('.gen-img-wrap');
  const generatorCarousel = document.getElementById('generatorCarousel');
  const carouselTrack = generatorCarousel ? generatorCarousel.querySelector('.gen-carousel-track') : null;
  const carouselItems = carouselTrack ? Array.from(carouselTrack.querySelectorAll('.gen-carousel-item')) : [];
  const carouselDotsWrap = generatorCarousel ? generatorCarousel.querySelector('.gen-carousel-dots') : null;
  const prevButton = generatorCarousel ? generatorCarousel.querySelector('.gen-carousel-prev') : null;
  const nextButton = generatorCarousel ? generatorCarousel.querySelector('.gen-carousel-next') : null;
  let currentIndex = 0;
  let autoSlideId = null;

  function getVisibleSlides(){
    if (window.innerWidth <= 900 || carouselItems.length <= 2) {
      return 1;
    }
    return 2;
  }

  function getPositionCount(){
    return Math.max(1, carouselItems.length - getVisibleSlides() + 1);
  }

  function getCarouselDots(){
    return carouselDotsWrap ? Array.from(carouselDotsWrap.querySelectorAll('.gen-dot')) : [];
  }

  function buildDots(){
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

  function updateDots(activePosition){
    getCarouselDots().forEach((dot, index) => {
      dot.classList.toggle('active', index === activePosition);
    });
  }

  function updateCarousel(){
    if (!carouselTrack || !carouselItems.length) {
      return;
    }

    const visibleSlides = getVisibleSlides();
    const maxStartIndex = Math.max(0, carouselItems.length - visibleSlides);
    const startIndex = Math.min(currentIndex, maxStartIndex);
    const itemWidth = carouselItems[0].getBoundingClientRect().width;
    const gap = visibleSlides === 1 ? 0 : 24;

    carouselTrack.style.transform = 'translateX(-' + (startIndex * (itemWidth + gap)) + 'px)';
    updateDots(startIndex);
  }

  function goToSlide(index){
    if (!carouselItems.length) {
      return;
    }
    currentIndex = (index + carouselItems.length) % carouselItems.length;
    updateCarousel();
  }

  function startAutoSlide(){
    if (!carouselItems.length) {
      return;
    }
    clearInterval(autoSlideId);
    autoSlideId = window.setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
  }

  function stopAutoSlide(){
    clearInterval(autoSlideId);
  }

  if (serviceImageWrap && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          serviceImageWrap.classList.add('is-visible');
          imageObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.35,
      rootMargin: '0px 0px -8% 0px'
    });

    imageObserver.observe(serviceImageWrap);
  } else if (serviceImageWrap) {
    serviceImageWrap.classList.add('is-visible');
  }

  if (generatorCarousel && carouselTrack && carouselItems.length) {
    buildDots();
    updateCarousel();
    startAutoSlide();

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

    generatorCarousel.addEventListener('mouseenter', stopAutoSlide);
    generatorCarousel.addEventListener('mouseleave', startAutoSlide);
    window.addEventListener('resize', () => {
      buildDots();
      updateCarousel();
    });
  }
})();
