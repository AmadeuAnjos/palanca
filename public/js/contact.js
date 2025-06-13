document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');
  const obrigadoModal = document.getElementById('obrigadoModal'); // Adicione esta linha

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Mostrar estado de carregamento
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

      try {
        const response = await fetch('http://localhost:3000/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao enviar mensagem');
        }

        // Sucesso - Mostrar modal em vez da mensagem
        obrigadoModal.classList.remove('hidden');
        contactForm.reset();

        // Opcional: Fechar modal automaticamente após 5 segundos
        setTimeout(() => {
          obrigadoModal.classList.add('hidden');
        }, 10000);

      } catch (error) {
        console.error('Erro:', error);
        formMessage.textContent = error.message || 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.';
        formMessage.className = 'mt-4 p-4 bg-red-100 text-red-700 rounded-lg';
        formMessage.classList.remove('hidden');
      } finally {
        // Restaurar botão
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }

      setTimeout(() => {
        formMessage.classList.add('hidden');
      }, 10000);
    });
  }

  // Adicione este código para fechar o modal quando clicar no botão
  const fecharModal = document.getElementById('fecharModal');
  if (fecharModal) {
    fecharModal.addEventListener('click', () => {
      const modal = document.getElementById('obrigadoModal');
      modal.classList.add('hidden');
    });
  }
});