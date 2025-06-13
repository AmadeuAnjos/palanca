// Menu mobile
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Marcar link ativo no menu
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
});

  document.getElementById('contact-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    const formMessage = document.getElementById('form-message');
    formMessage.classList.remove('hidden');
    formMessage.classList.remove('text-green-600', 'text-red-600');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, message })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        formMessage.textContent = 'Mensagem enviada com sucesso!';
        formMessage.classList.add('text-green-600');
        document.getElementById('contact-form').reset();
      } else {
        formMessage.textContent = result.message || 'Erro ao enviar mensagem.';
        formMessage.classList.add('text-red-600');
      }
    } catch (error) {
      formMessage.textContent = 'Erro ao enviar mensagem. Tente novamente mais tarde.';
      formMessage.classList.add('text-red-600');
      console.error(error);
    }
  });
