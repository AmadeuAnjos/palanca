document.addEventListener('DOMContentLoaded', function() {
    const messagesTable = document.getElementById('messages-table').getElementsByTagName('tbody')[0];
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');
    const confirmModal = document.getElementById('confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalMessages = 0;
    let messages = [];
    let messageToDelete = null;
    
    // Carregar mensagens
    function loadMessages(page = 1) {
        currentPage = page;
        
        fetch(`/api/messages?page=${page}&limit=${itemsPerPage}`)
            .then(response => response.json())
            .then(data => {
                messages = data.messages;
                totalMessages = data.total;
                renderMessages();
                renderPagination();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    
    // Renderizar mensagens na tabela
    function renderMessages() {
        messagesTable.innerHTML = '';
        
        if (messages.length === 0) {
            const row = messagesTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.className = 'py-4 px-4 text-center text-gray-500';
            cell.textContent = 'Nenhuma mensagem encontrada.';
            return;
        }
        
        messages.forEach(message => {
            const row = messagesTable.insertRow();
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            
            // Formatar data
            const date = new Date(message.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
            
            // Células
            const cellDate = row.insertCell();
            cellDate.className = 'py-3 px-4';
            cellDate.textContent = formattedDate;
            
            const cellName = row.insertCell();
            cellName.className = 'py-3 px-4';
            cellName.textContent = message.name;
            
            const cellEmail = row.insertCell();
            cellEmail.className = 'py-3 px-4';
            cellEmail.textContent = message.email;
            
            const cellMessage = row.insertCell();
            cellMessage.className = 'py-3 px-4';
            cellMessage.textContent = message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message;
            
            const cellActions = row.insertCell();
            cellActions.className = 'py-3 px-4';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-red-600 hover:text-red-800 transition';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => showDeleteModal(message.id));
            
            cellActions.appendChild(deleteBtn);
        });
    }
    
    // Renderizar controles de paginação
    function renderPagination() {
        const totalPages = Math.ceil(totalMessages / itemsPerPage);
        
        // Info
        paginationInfo.textContent = `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalMessages)} de ${totalMessages} mensagens`;
        
        // Controles
        paginationControls.innerHTML = '';
        
        // Botão Anterior
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 transition';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => loadMessages(currentPage - 1));
            paginationControls.appendChild(prevBtn);
        }
        
        // Números de página
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `px-3 py-1 rounded mx-1 ${i === currentPage ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => loadMessages(i));
            paginationControls.appendChild(pageBtn);
        }
        
        // Botão Próximo
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 transition';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => loadMessages(currentPage + 1));
            paginationControls.appendChild(nextBtn);
        }
    }
    
    // Mostrar modal de confirmação
    function showDeleteModal(messageId) {
        messageToDelete = messageId;
        confirmModal.classList.remove('hidden');
    }
    
    // Esconder modal
    function hideDeleteModal() {
        confirmModal.classList.add('hidden');
        messageToDelete = null;
    }
    
    // Event listeners
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (messageToDelete) {
                fetch(`/api/messages/${messageToDelete}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Recarregar mensagens
                        loadMessages(currentPage);
                    } else {
                        alert('Erro ao excluir mensagem: ' + (data.message || 'Erro desconhecido'));
                    }
                    hideDeleteModal();
                })
                .catch(error => {
                    console.error('Error:', error);
                    hideDeleteModal();
                    alert('Erro ao excluir mensagem. Tente novamente.');
                });
            }
        });
    }
    
    // Carregar mensagens inicialmente
    loadMessages();
});