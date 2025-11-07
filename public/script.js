// Fade-in animation on scroll
document.addEventListener('DOMContentLoaded', () => {
  const fadeInElements = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  fadeInElements.forEach(element => {
    observer.observe(element);
  });

  // Hamburger menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !isExpanded);
    navLinks.classList.toggle('active');
    hamburger.innerHTML = isExpanded ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
  });

  // Reservation form submission to WhatsApp
  const form = document.getElementById('reservation-form');
  const successMessage = document.getElementById('success-message');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
  
    // Get form values
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const guests = document.getElementById('guests').value;
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
  
    // Create WhatsApp message
    const whatsappNumber = '+573143352544';
    const whatsappMessage = `Hola! Me gustaría hacer una reserva en Pescador, por favor%0A%0A` +
      `Fecha: ${date}%0A` +
      `Hora: ${time}%0A` +
      `Número de personas: ${guests}%0A` +
      `A nombre de: ${name}%0A` +
      `Número de contacto: ${phone}%0A` +
      (message ? `Mensaje: ${message}%0A` : '');
  
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  
    // Show success message
    successMessage.style.display = 'block';
    successMessage.style.opacity = '1';
    form.reset();
  
    // Hide the message after 3 seconds
    setTimeout(() => {
      successMessage.style.opacity = '0';
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 500);
    }, 3000);
  });
});